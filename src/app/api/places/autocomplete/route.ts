import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enforceSameOrigin, rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { autocompleteCities } from "@/lib/places-autocomplete";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(1).max(100),
  stateHint: z.string().max(3).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const s = await auth();
    if (!s?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = rateLimitOr429(request, "places_autocomplete");
    if (rl) return rl;

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
    console.error("[api/places/autocomplete]", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
