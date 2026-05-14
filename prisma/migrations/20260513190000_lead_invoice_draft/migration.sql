-- Per-lead saved defaults for the invoice builder (line items, tax, notes, etc.).
ALTER TABLE "Lead" ADD COLUMN "invoiceDraft" JSONB;
