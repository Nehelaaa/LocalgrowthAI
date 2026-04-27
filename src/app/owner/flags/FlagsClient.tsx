"use client";

import { useMemo, useState, useTransition } from "react";
import { ownerSetFeatureOverride, ownerUpsertFeatureFlag } from "@/actions/owner-flags";

type Flag = {
  id: string;
  key: string;
  label: string;
  freeEnabled: boolean;
  proEnabled: boolean;
  overrides: Array<{
    id: string;
    enabled: boolean;
    user: { id: string; email: string; name: string | null };
  }>;
};

export function FlagsClient({ flags, users }: { flags: Flag[]; users: Array<{ id: string; email: string; name: string | null }> }) {
  const [pending, start] = useTransition();
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newFree, setNewFree] = useState(false);
  const [newPro, setNewPro] = useState(true);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.email < b.email ? -1 : 1));
  }, [users]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create / update flag</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Key</label>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. exports"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Label</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Exports"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={newFree} onChange={(e) => setNewFree(e.target.checked)} />
            Free enabled
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={newPro} onChange={(e) => setNewPro(e.target.checked)} />
            Pro enabled
          </label>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerUpsertFeatureFlag({ key: newKey.trim(), label: newLabel.trim(), freeEnabled: newFree, proEnabled: newPro });
              setNewKey("");
              setNewLabel("");
              setNewFree(false);
              setNewPro(true);
            });
          }}
          className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save flag
        </button>
      </section>

      <div className="space-y-4">
        {flags.map((f) => (
          <section key={f.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{f.label}</p>
                <p className="text-xs text-slate-500">{f.key}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={"rounded-lg px-2 py-1 font-semibold " + (f.freeEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                  Free: {f.freeEnabled ? "on" : "off"}
                </span>
                <span className={"rounded-lg px-2 py-1 font-semibold " + (f.proEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                  Pro: {f.proEnabled ? "on" : "off"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per-user override</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sortedUsers.slice(0, 24).map((u) => {
                  const current = f.overrides.find((o) => o.user.id === u.id)?.enabled;
                  return (
                    <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-950/20">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name || u.email}</p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          start(async () => {
                            await ownerSetFeatureOverride({
                              featureId: f.id,
                              userId: u.id,
                              enabled: !(current ?? false),
                            });
                          });
                        }}
                        className={"min-h-10 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 " + ((current ?? false) ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100")}
                      >
                        {(current ?? false) ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Showing first 24 users for fast rendering. (We can add search if you want.)
              </p>
            </div>
          </section>
        ))}
        {flags.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            No flags yet. Create one above.
          </div>
        )}
      </div>
    </div>
  );
}

