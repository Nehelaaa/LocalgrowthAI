import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-user";
import { isTradesProfession } from "@/lib/profession";

export async function requireTradesDashboardUser() {
  const u = await getCurrentUser();
  if (!u) {
    redirect("/login?callbackUrl=/dashboard/trades");
  }
  if (!u.onboardingComplete) {
    redirect("/onboarding");
  }
  if (u.disabled) {
    redirect("/unauthorized");
  }
  if (!isTradesProfession(u.profession)) {
    redirect("/dashboard");
  }
  return u;
}
