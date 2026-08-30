-- Account-level invoice branding (logo + template) so mobile/desktop stay in sync.
ALTER TABLE "User" ADD COLUMN "invoiceSenderTemplate" JSONB;
