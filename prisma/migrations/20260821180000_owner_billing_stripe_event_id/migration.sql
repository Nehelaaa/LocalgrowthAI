-- AlterTable
ALTER TABLE "OwnerBillingEvent" ADD COLUMN IF NOT EXISTS "stripeEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OwnerBillingEvent_stripeEventId_key" ON "OwnerBillingEvent"("stripeEventId");
