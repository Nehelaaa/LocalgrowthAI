"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export type LoginCredentialsState = { error?: string };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

function pathWithQueryFromUrl(nextUrl: string, origin: string): string | null {
  try {
    const resolved = new URL(nextUrl, origin);
    const expected = new URL(origin);
    if (resolved.origin !== expected.origin) return null;
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return null;
  }
}

/**
 * Email/password sign-in on the server so session cookies are set on the Server Action
 * response (reliable on mobile Safari / WebView; client `signIn` can race Set-Cookie).
 */
export async function loginWithCredentials(
  _prev: LoginCredentialsState | undefined,
  formData: FormData
): Promise<LoginCredentialsState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const rawCb = formData.get("callbackUrl");
  const redirectTo =
    typeof rawCb === "string" && rawCb.startsWith("/") && !rawCb.startsWith("//")
      ? rawCb
      : "/auth/continue?next=" + encodeURIComponent("/dashboard");

  const nextUrl = await signIn("credentials", {
    email,
    password,
    redirectTo,
    redirect: false,
  });

  if (typeof nextUrl !== "string") {
    return { error: "Sign-in failed." };
  }

  const origin = await requestOrigin();
  const path = pathWithQueryFromUrl(nextUrl, origin);
  if (!path) {
    return { error: "Sign-in failed." };
  }

  try {
    const u = new URL(path, origin);
    if (u.searchParams.get("error")) {
      return { error: "Invalid email or password." };
    }
  } catch {
    return { error: "Sign-in failed." };
  }

  redirect(path);
}
