import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin } from "@/lib/api-security";
import { secureHttpOnlyDefaults } from "@/lib/cookie-defaults";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;
  await requireOwnerOrRedirect();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  const u = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!u) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lg_impersonate", u.id, {
    ...secureHttpOnlyDefaults(),
    maxAge: 60 * 60 * 6,
  });
  return res;
}

