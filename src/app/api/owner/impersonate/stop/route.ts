import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceSameOrigin } from "@/lib/api-security";
import { secureHttpOnlyDefaults } from "@/lib/cookie-defaults";
import { requireOwnerOrRedirect } from "@/lib/owner";

export async function POST(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;
  await requireOwnerOrRedirect();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lg_impersonate", "", {
    ...secureHttpOnlyDefaults(),
    maxAge: 0,
  });
  return res;
}

