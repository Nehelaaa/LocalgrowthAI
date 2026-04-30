import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enforceSameOrigin, rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { searchPlaces } from "@/lib/google-places";
import { prisma } from "@/lib/db";
import { getCachedSearchResults, placesSearchCacheKey, setCachedSearchResults } from "@/lib/places-search-cache";
import { getSearchUsageState, incrementSearchUsageForUser } from "@/lib/search-usage";
import { z } from "zod";

const schema = z.object({
  city: z.string().min(1),
  state: z.string().min(1),
  radiusMiles: z.number().min(1).max(50),
  businessType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const s = await auth();
    if (!s?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = rateLimitOr429(request, "places_search");
    if (rl) return rl;

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

    // When Starter quota is exhausted, block usage (including cache) until upgrade.
    const usageBefore = await getSearchUsageState(user);
    if (usageBefore.remaining === 0) {
      return NextResponse.json(
        {
          error: "Daily search limit reached",
          code: "SEARCH_LIMIT",
          usage: {
            used: usageBefore.used,
            limit: usageBefore.limit,
            remaining: 0,
            day: usageBefore.day,
          },
        },
        { status: 403 }
      );
    }

    const cached = await getCachedSearchResults(cacheKey);
    if (cached) {
      return NextResponse.json({
        places: cached,
        fromCache: true,
        usage: {
          used: usageBefore.used,
          limit: usageBefore.limit,
          remaining: usageBefore.remaining,
          day: usageBefore.day,
        },
      });
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
    console.error("[api/places/search]", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
