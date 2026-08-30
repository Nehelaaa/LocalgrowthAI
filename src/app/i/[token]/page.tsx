import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicInvoicePayPanel } from "@/components/invoices/PublicInvoicePayPanel";
import { PublicInvoiceView } from "@/components/invoices/PublicInvoiceView";
import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { getValidInvoiceShareByToken } from "@/lib/invoice-share";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { markInvoiceSharePaidFromCheckout } from "@/lib/stripe-connect";
import { sanitizeInvoiceDocumentTitle } from "@/lib/invoice-wording";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string; session_id?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const share = await getValidInvoiceShareByToken(token);
  if (!share) {
    return { title: "Invoice not found", robots: { index: false, follow: false } };
  }
  const title = sanitizeInvoiceDocumentTitle(
    share.snapshot.invoiceDocumentTitle
  );
  const company =
    share.snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();
  return {
    title: `${title} ${share.snapshot.invoiceNumber} · ${company}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;

  // After Checkout return, confirm payment even if the webhook is slightly late.
  if (sp.paid === "1" && sp.session_id && isStripeConfigured()) {
    try {
      const shareRow = await prisma.invoiceShare.findUnique({
        where: { token },
        select: {
          paymentStatus: true,
          user: { select: { stripeConnectAccountId: true } },
        },
      });
      const accountId = shareRow?.user.stripeConnectAccountId;
      if (accountId && shareRow?.paymentStatus !== "paid") {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sp.session_id, undefined, {
          stripeAccount: accountId,
        });
        if (session.payment_status === "paid" || session.status === "complete") {
          await markInvoiceSharePaidFromCheckout(session);
        }
      }
    } catch (e) {
      console.error("[public invoice] confirm paid session", e);
    }
  }

  const share = await getValidInvoiceShareByToken(token);
  if (!share) notFound();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <p className="text-sm text-slate-500">Shared invoice</p>
      </div>
      <PublicInvoiceView snapshot={share.snapshot} />
      <PublicInvoicePayPanel
        token={share.token}
        amountCents={share.payment.amountCents ?? 0}
        canPay={share.payment.canPay}
        status={share.payment.status}
        queryPaid={sp.paid === "1"}
        queryCanceled={sp.canceled === "1"}
      />
      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-400">
        Powered by{" "}
        <Link
          href="/"
          className="font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          LocalLeadster
        </Link>
      </p>
    </div>
  );
}
