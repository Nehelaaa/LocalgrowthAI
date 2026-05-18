-- Allow each user to have their own CRM lead for the same Google Place (shared Business row).
DROP INDEX IF EXISTS "Lead_businessId_key";

CREATE UNIQUE INDEX "Lead_userId_businessId_key" ON "Lead"("userId", "businessId");

CREATE INDEX IF NOT EXISTS "Lead_businessId_idx" ON "Lead"("businessId");
