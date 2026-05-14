-- Optional point-of-contact fields on CRM leads (name / phone / email).
ALTER TABLE "Lead" ADD COLUMN "pocName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "pocPhone" TEXT;
ALTER TABLE "Lead" ADD COLUMN "pocEmail" TEXT;
