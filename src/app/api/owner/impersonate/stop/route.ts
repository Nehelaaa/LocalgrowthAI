import { NextResponse } from "next/server";
import { requireOwnerOrRedirect } from "@/lib/owner";

export async function POST() {
  await requireOwnerOrRedirect();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lg_impersonate", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

