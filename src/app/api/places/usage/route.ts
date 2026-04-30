import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSearchUsageState } from "@/lib/search-usage";
import { rateLimitOr429, safeErrorMessage } from "@/lib/api-security";

export async function GET(request: Request) {
  try {
    const s = await auth();
    if (!s?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = rateLimitOr429(request, "places_usage");
    if (rl) return rl;

    const user = await prisma.user.findUnique({ where: { id: s.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const usage = await getSearchUsageState(user);
    return NextResponse.json(usage);
  } catch (e) {
    console.error("[api/places/usage]", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
