import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";
import { AddOwnerCard } from "./AddOwnerCard";
import { OwnerUsersTable } from "./OwnerUsersTable";

export default async function OwnerUsersPage() {
  await requireOwnerOrRedirect();
  const day = getUtcDayString();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      grandfatheredPro: true,
      subscriptionStatus: true,
      disabled: true,
      createdAt: true,
      _count: { select: { leads: true } },
      searchDayUsages: {
        where: { day },
        select: { count: true },
        take: 1,
      },
    },
    take: 500,
  });

  const accountRows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    plan: u.plan,
    subscriptionStatus: u.subscriptionStatus,
    disabled: u.disabled,
    grandfatheredPro: u.grandfatheredPro,
    leadsCount: u._count.leads,
    searchesToday: u.searchDayUsages[0]?.count ?? 0,
  }));

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Users
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Open a user to view activity, billing status, and take admin actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Total: {users.length}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            Today: {day}
          </span>
        </div>
      </header>

      <AddOwnerCard />

      <OwnerUsersTable rows={accountRows} />
    </div>
  );
}

