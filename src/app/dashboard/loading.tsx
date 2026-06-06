import { AuthTransitionScreen } from "@/components/auth/AuthTransitionScreen";

export default function DashboardLoading() {
  return (
    <AuthTransitionScreen
      message="Loading your dashboard…"
      submessage="Pulling up your pipeline and tools."
    />
  );
}
