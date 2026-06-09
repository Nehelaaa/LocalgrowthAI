import { getDashboardData } from "@/actions/metrics";
import { requireDashboardUser } from "@/lib/session-user";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

function firstName(name: string | null, email: string): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/)[0] ?? name.trim();
  }
  const local = email.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([
    requireDashboardUser(),
    getDashboardData(),
  ]);

  return (
    <DashboardOverview
      userName={firstName(user.name, user.email)}
      metrics={data}
    />
  );
}
