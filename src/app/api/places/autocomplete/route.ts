import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { autocompleteCities } from "@/lib/places-autocomplete";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(1).max(100),
  stateHint: z.string().max(3).optional(),
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const suggestions = await autocompleteCities(
      parsed.data.input,
      parsed.data.stateHint
    );
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Autocomplete failed" },
      { status: 500 }
    );
  }
}
