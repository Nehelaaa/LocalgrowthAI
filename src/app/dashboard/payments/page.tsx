import { InvoicePaymentsClient } from "./InvoicePaymentsClient";
import { hasProEntitlement } from "@/lib/entitlements";
import { requireDashboardUser } from "@/lib/session-user";
import { syncConnectAccountFromStripe } from "@/lib/stripe-connect";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice payments",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function PaymentsPage({ searchParams }: Props) {
  const user = await requireDashboardUser();
  await syncConnectAccountFromStripe(user.id);
  const sp = await searchParams;

  return (
    <InvoicePaymentsClient
      initialIsPro={hasProEntitlement(user)}
      connectReturn={sp.connect ?? null}
    />
  );
}
