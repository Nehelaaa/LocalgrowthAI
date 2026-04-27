import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-user";
import { hasProEntitlement } from "@/lib/entitlements";
import { ExportActions } from "./ExportActions";
import { redirect } from "next/navigation";

export default async function ExportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/export");
  const count = await prisma.lead.count({ where: { userId: user.id } });
  const canExport = hasProEntitlement(user);

  return (
    <div className="w-full min-w-0 max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
        Export
      </h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Export your leads to CSV or use the API for Google Sheets / webhooks.
      </p>
      <ExportActions totalLeads={count} canExport={canExport} />
      <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
          API export
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          GET <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/api/export/leads</code> returns
          all leads as JSON. Use with Zapier/Make or Google Sheets for sync.
        </p>
        <p className="text-sm text-slate-500">
          Webhook: POST to your URL with new lead payloads (configure in env).
        </p>
      </div>
    </div>
  );
}
