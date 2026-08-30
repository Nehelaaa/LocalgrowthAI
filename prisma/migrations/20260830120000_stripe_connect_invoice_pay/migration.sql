-- Stripe Connect (Express) for Pro users collecting invoice payments.
ALTER TABLE "User" ADD COLUMN "stripeConnectAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "stripeConnectOnboardedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

ALTER TABLE "InvoiceShare" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'unpayable';
ALTER TABLE "InvoiceShare" ADD COLUMN "amountCents" INTEGER;
ALTER TABLE "InvoiceShare" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd';
ALTER TABLE "InvoiceShare" ADD COLUMN "stripeCheckoutSessionId" TEXT;
ALTER TABLE "InvoiceShare" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "InvoiceShare" ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE INDEX "InvoiceShare_paymentStatus_idx" ON "InvoiceShare"("paymentStatus");
CREATE INDEX "InvoiceShare_stripeCheckoutSessionId_idx" ON "InvoiceShare"("stripeCheckoutSessionId");
