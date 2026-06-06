import { safeRelativeAppNextPath } from "@/lib/post-login-continue";
import { connection } from "next/server";
import type { Metadata } from "next";
import { AuthContinueFlow } from "./AuthContinueFlow";

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

  return <AuthContinueFlow next={next} />;
}
