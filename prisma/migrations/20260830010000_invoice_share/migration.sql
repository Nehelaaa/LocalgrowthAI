-- Shareable public invoice links (SMS / copy link).
CREATE TABLE "InvoiceShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "InvoiceShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoiceShare_token_key" ON "InvoiceShare"("token");
CREATE INDEX "InvoiceShare_userId_idx" ON "InvoiceShare"("userId");
CREATE INDEX "InvoiceShare_expiresAt_idx" ON "InvoiceShare"("expiresAt");

ALTER TABLE "InvoiceShare" ADD CONSTRAINT "InvoiceShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
