import { auth } from "@/lib/auth";
import { isOwnerSession } from "@/lib/owner";
import { safeRelativeAppNextPath } from "@/lib/post-login-continue";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signing you in",
  robots: { index: false, follow: false },
};

type Search = Promise<{ next?: string | string[] }>;

export default async function AuthContinuePage({ searchParams }: { searchParams: Search }) {
  const s = await auth();
  if (!s?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/dashboard"));
  }

  const q = await searchParams;
  const rawNext = typeof q.next === "string" ? q.next : undefined;
  const next = safeRelativeAppNextPath(rawNext);

  if (isOwnerSession(s)) {
    redirect("/owner");
  }
  redirect(next);
}
