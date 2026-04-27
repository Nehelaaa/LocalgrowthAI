import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/db";
import { getCachedSearchResults, placesSearchCacheKey, setCachedSearchResults } from "@/lib/places-search-cache";
import { canPerformGoogleSearch, getSearchUsageState, incrementSearchUsageForUser } from "@/lib/search-usage";
import { z } from "zod";

const schema = z.object({
  city: z.string().min(1),
  state: z.string().min(1),
  radiusMiles: z.number().min(1).max(50),
  businessType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const s = await auth();
    if (!s?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const key = getClientIdentifier(request);
    const { success } = rateLimit(key);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: s.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const params = parsed.data;
    const cacheKey = placesSearchCacheKey(params);

    const cached = await getCachedSearchResults(cacheKey);
    if (cached) {
      const usage = await getSearchUsageState(user);
      return NextResponse.json({
        places: cached,
        fromCache: true,
        usage: {
          used: usage.used,
          limit: usage.limit,
          remaining: usage.remaining,
          day: usage.day,
        },
      });
    }

    if (!(await canPerformGoogleSearch(user))) {
      const usage = await getSearchUsageState(user);
      return NextResponse.json(
        {
          error: "Daily search limit reached",
          code: "SEARCH_LIMIT",
          usage: {
            used: usage.used,
            limit: usage.limit,
            remaining: 0,
            day: usage.day,
          },
        },
        { status: 403 }
      );
    }

    const results = await searchPlaces(params);
    await setCachedSearchResults(cacheKey, results);
    await incrementSearchUsageForUser(user.id);

    const usage = await getSearchUsageState(user);
    return NextResponse.json({
      places: results,
      fromCache: false,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        day: usage.day,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
