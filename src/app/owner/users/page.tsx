import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";

export default async function OwnerUsersPage() {
  await requireOwnerOrRedirect();
  const day = getUtcDayString();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Searches today</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-950/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/owner/users/${u.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                    >
                      {u.name || u.email}
                    </Link>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                      {u.plan}
                    </span>
                    {u.subscriptionStatus && (
                      <div className="mt-1 text-xs text-slate-500">
                        {u.subscriptionStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u._count.leads}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {u.searchDayUsages[0]?.count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {u.disabled ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                        disabled
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                        active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

