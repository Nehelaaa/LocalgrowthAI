import { prisma } from "@/lib/db";

export type OwnerBillingEventKind =
  | "payment_failed"
  | "payment_succeeded"
  | "refund"
  | "dispute"
  | "subscription_canceled"
  | "subscription_updated"
  | "other";

export type OwnerBillingSeverity = "info" | "warning" | "critical";

export async function findUserIdByStripeCustomerId(
  customerId: string | null | undefined
): Promise<string | null> {
  if (!customerId) return null;
  const u = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return u?.id ?? null;
}

export async function findUserIdByEmail(
  email: string | null | undefined
): Promise<string | null> {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (!e) return null;
  const u = await prisma.user.findUnique({ where: { email: e }, select: { id: true } });
  return u?.id ?? null;
}

export async function createOwnerBillingEvent(input: {
  kind: OwnerBillingEventKind;
  severity?: OwnerBillingSeverity;
  title: string;
  body?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  stripeChargeId?: string | null;
  userId?: string | null;
  metadata?: unknown;
}) {
  await prisma.ownerBillingEvent.create({
    data: {
      kind: input.kind,
      severity: input.severity ?? "info",
      title: input.title,
      body: input.body ?? null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      stripeInvoiceId: input.stripeInvoiceId ?? null,
      stripeChargeId: input.stripeChargeId ?? null,
      userId: input.userId ?? null,
      metadata: input.metadata == null ? undefined : (input.metadata as object),
    },
  });
}
