import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request) {
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
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6, // 6h
  });
  return res;
}

