import { auth } from "@/lib/auth";
import { isOwnerSession } from "@/lib/owner";
import { safeRelativeAppNextPath } from "@/lib/post-login-continue";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

/** Fresh cookies/session read per request (avoid static/RSC caching treating everyone as logged out). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signing you in",
  robots: { index: false, follow: false },
};

type Search = Promise<{ next?: string | string[] }>;

export default async function AuthContinuePage({ searchParams }: { searchParams: Search }) {
  await connection();
  const q = await searchParams;
  const rawNext = typeof q.next === "string" ? q.next : undefined;
  const next = safeRelativeAppNextPath(rawNext);

  const s = await auth();
  if (!s?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent(next));
  }

  if (isOwnerSession(s)) {
    redirect("/owner");
  }
  redirect(next);
}
