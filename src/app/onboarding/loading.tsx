import { AuthTransitionScreen } from "@/components/auth/AuthTransitionScreen";

export default function OnboardingLoading() {
  return (
    <AuthTransitionScreen
      message="Setting up your account…"
      submessage="Almost ready — one more step."
    />
  );
}
