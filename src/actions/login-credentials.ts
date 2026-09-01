"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { INVALID_CREDENTIALS, SIGN_IN_FAILED } from "@/lib/auth-messages";

export type LoginCredentialsState = {
  error?: string;
  /** Echoed back so a failed attempt doesn't make the user retype their email. */
  email?: string;
};

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

  let nextUrl: unknown;
  try {
    nextUrl = await signIn("credentials", {
      email,
      password,
      redirectTo,
      redirect: false,
    });
  } catch (e) {
    // Auth.js throws CredentialsSignin when `authorize` returns null. Uncaught, it
    // escapes the Server Action and Next renders a 500 error page instead of the
    // form — so a wrong password looked like the site had crashed.
    if (e instanceof AuthError) {
      return e.type === "CredentialsSignin"
        ? { error: INVALID_CREDENTIALS, email }
        : { error: SIGN_IN_FAILED, email };
    }
    throw e;
  }

  if (typeof nextUrl !== "string") {
    return { error: SIGN_IN_FAILED, email };
  }

  const origin = await requestOrigin();
  const path = pathWithQueryFromUrl(nextUrl, origin);
  if (!path) {
    return { error: SIGN_IN_FAILED, email };
  }

  try {
    const u = new URL(path, origin);
    if (u.searchParams.get("error")) {
      return { error: INVALID_CREDENTIALS, email };
    }
  } catch {
    return { error: SIGN_IN_FAILED, email };
  }

  redirect(path);
}
