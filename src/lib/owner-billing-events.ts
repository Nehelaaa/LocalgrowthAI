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

/** True if this Stripe Event.id was already processed (webhook retry / redelivery). */
export async function hasProcessedStripeEvent(stripeEventId: string): Promise<boolean> {
  const existing = await prisma.ownerBillingEvent.findUnique({
    where: { stripeEventId },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function createOwnerBillingEvent(input: {
  kind: OwnerBillingEventKind;
  severity?: OwnerBillingSeverity;
  title: string;
  body?: string | null;
  stripeEventId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  stripeChargeId?: string | null;
  userId?: string | null;
  metadata?: unknown;
}): Promise<{ created: boolean }> {
  if (input.stripeEventId) {
    const existing = await prisma.ownerBillingEvent.findUnique({
      where: { stripeEventId: input.stripeEventId },
      select: { id: true },
    });
    if (existing) return { created: false };
  }

  try {
    await prisma.ownerBillingEvent.create({
      data: {
        kind: input.kind,
        severity: input.severity ?? "info",
        title: input.title,
        body: input.body ?? null,
        stripeEventId: input.stripeEventId ?? null,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        stripeInvoiceId: input.stripeInvoiceId ?? null,
        stripeChargeId: input.stripeChargeId ?? null,
        userId: input.userId ?? null,
        metadata: input.metadata == null ? undefined : (input.metadata as object),
      },
    });
    return { created: true };
  } catch (e) {
    // Race: two deliveries of the same event.id
    const code =
      e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002" && input.stripeEventId) {
      return { created: false };
    }
    throw e;
  }
}
