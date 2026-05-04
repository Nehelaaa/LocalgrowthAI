"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type OwnerAccountRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  plan: string;
  subscriptionStatus: string | null;
  disabled: boolean;
  grandfatheredPro: boolean;
  leadsCount: number;
  searchesToday: number;
};

type PlanFilter = "all" | "pro" | "free";
type RoleFilter = "all" | "owner" | "user";
type StatusFilter = "all" | "active" | "disabled";
type ActivityFilter = "all" | "has_leads" | "searched_today";

function isEffectivePro(row: OwnerAccountRow) {
  return row.grandfatheredPro || row.plan.toLowerCase() === "pro";
}

const selectClass =
  "min-h-[40px] min-w-[8.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500";

export function OwnerUsersTable({ rows }: { rows: OwnerAccountRow[] }) {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [activity, setActivity] = useState<ActivityFilter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle) {
        const hay = `${r.name ?? ""} ${r.email}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (plan === "pro" && !isEffectivePro(r)) return false;
      if (plan === "free" && isEffectivePro(r)) return false;
      if (role === "owner" && r.role !== "ADMIN") return false;
      if (role === "user" && r.role === "ADMIN") return false;
      if (status === "active" && r.disabled) return false;
      if (status === "disabled" && !r.disabled) return false;
      if (activity === "has_leads" && r.leadsCount <= 0) return false;
      if (activity === "searched_today" && r.searchesToday <= 0) return false;
      return true;
    });
  }, [rows, q, plan, role, status, activity]);

  const hasActiveFilters =
    plan !== "all" ||
    role !== "all" ||
    status !== "all" ||
    activity !== "all" ||
    q.trim() !== "";

  const clearFilters = () => {
    setQ("");
    setPlan("all");
    setRole("all");
    setStatus("all");
    setActivity("all");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 lg:max-w-md">
            <label htmlFor="owner-users-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Search
            </label>
            <input
              id="owner-users-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or email…"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="owner-filter-plan" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Plan
              </label>
              <select
                id="owner-filter-plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanFilter)}
                className={"mt-1 block " + selectClass}
              >
                <option value="all">All plans</option>
                <option value="pro">Pro (incl. grandfathered)</option>
                <option value="free">Free only</option>
              </select>
            </div>
            <div>
              <label htmlFor="owner-filter-role" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Role
              </label>
              <select
                id="owner-filter-role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleFilter)}
                className={"mt-1 block " + selectClass}
              >
                <option value="all">All roles</option>
                <option value="owner">Owner</option>
                <option value="user">User</option>
              </select>
            </div>
            <div>
              <label htmlFor="owner-filter-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Account
              </label>
              <select
                id="owner-filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className={"mt-1 block " + selectClass}
              >
                <option value="all">Active and disabled</option>
                <option value="active">Active only</option>
                <option value="disabled">Disabled only</option>
              </select>
            </div>
            <div>
              <label htmlFor="owner-filter-activity" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Activity
              </label>
              <select
                id="owner-filter-activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityFilter)}
                className={"mt-1 block " + selectClass}
              >
                <option value="all">Any activity</option>
                <option value="has_leads">Has leads</option>
                <option value="searched_today">Searched today</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 text-xs text-slate-600 dark:border-slate-800/70 dark:text-slate-400">
          <p>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{rows.length}</span> loaded
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Searches today</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
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
                    {u.role === "ADMIN" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                        owner
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        user
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                      {u.plan}
                    </span>
                    {u.grandfatheredPro && u.plan.toLowerCase() !== "pro" && (
                      <div className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">grandfathered pro</div>
                    )}
                    {u.subscriptionStatus && (
                      <div className="mt-1 text-xs text-slate-500">{u.subscriptionStatus}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u.leadsCount}</td>
                  <td className="px-4 py-3 tabular-nums">{u.searchesToday}</td>
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
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    {rows.length === 0 ? "No users found." : "No accounts match these filters."}
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
