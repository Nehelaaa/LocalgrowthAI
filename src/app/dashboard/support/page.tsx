import { SupportContactForm } from "@/components/dashboard/SupportContactForm";
import { requireDashboardUser } from "@/lib/session-user";

export default async function SupportPage() {
  const user = await requireDashboardUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contact support
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Send a question or issue to our team — with optional screenshots or PDFs. Messages
          go to the same inbox we use for customer support.
        </p>
      </div>
      <SupportContactForm accountEmail={user.email} />
    </div>
  );
}
