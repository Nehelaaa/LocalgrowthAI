import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { ownerListFeatureFlags } from "@/actions/owner-flags";
import { FlagsClient } from "./FlagsClient";

export default async function OwnerFlagsPage() {
  await requireOwnerOrRedirect();
  const [flags, users] = await Promise.all([
    ownerListFeatureFlags(),
    prisma.user.findMany({ select: { id: true, email: true, name: true }, take: 500 }),
  ]);

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Feature flags
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enable/disable features per plan and optionally per user.
        </p>
      </header>
      <FlagsClient flags={flags} users={users} />
    </div>
  );
}

