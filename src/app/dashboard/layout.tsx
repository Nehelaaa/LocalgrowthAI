import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { StarterLimitOverlay } from "@/components/dashboard/StarterLimitOverlay";
import { getCurrentUser } from "@/lib/session-user";
import { canCreateMoreLeads, FREE_LEAD_LIMIT, hasProEntitlement } from "@/lib/entitlements";
import { isOwnerEmail } from "@/lib/owner";
import { getSearchUsageState } from "@/lib/search-usage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }
  const isPro = hasProEntitlement(user);
  const canCreateLeads = canCreateMoreLeads(user.lifetimeLeadsCreated, user);
  const usage = await getSearchUsageState(user);
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100/90 dark:bg-slate-950">
      <DashboardNav
        user={{
          email: user.email,
          name: user.name,
          isPro,
          showTrades: false,
          showOwner: isOwnerEmail(user.email),
        }}
      />
      <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto lg:pl-0">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"
          aria-hidden
        />
        <StarterLimitOverlay
          isPro={isPro}
          atLeadCap={!canCreateLeads}
          atSearchCap={usage.remaining === 0}
          leadsUsed={user.lifetimeLeadsCreated}
          leadsLimit={FREE_LEAD_LIMIT}
          searchesUsed={usage.used}
          searchesLimit={usage.limit}
        />
        <div className="relative z-0 min-h-full w-full min-w-0 p-3 pt-16 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 md:px-6 lg:pt-5 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
