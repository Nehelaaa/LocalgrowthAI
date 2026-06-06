"use server";

import { auth } from "@/lib/auth";
import { isOwnerSession } from "@/lib/owner";
import { safeRelativeAppNextPath } from "@/lib/post-login-continue";
import { getCurrentUser } from "@/lib/session-user";

/** Where to send the user after OAuth / credentials once the session cookie is present. */
export async function getPostLoginDestination(
  nextPath: string
): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (isOwnerSession(session)) {
    return "/owner";
  }
  if (!user.onboardingComplete) {
    return "/onboarding";
  }
  return safeRelativeAppNextPath(nextPath);
}
