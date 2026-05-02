import { signOut } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Server-side sign-out (clears session cookies). Use a normal navigation to this route
 * so sign-out works even when client-side fetch/CSRF to `/api/auth/signout` fails.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return signOut({ redirectTo: `${origin}/login` });
}
