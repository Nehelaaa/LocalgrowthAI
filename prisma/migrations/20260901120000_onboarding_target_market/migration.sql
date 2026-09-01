-- Territory captured during onboarding so the first Places search comes prefilled.
ALTER TABLE "User" ADD COLUMN "targetCity" TEXT;
ALTER TABLE "User" ADD COLUMN "targetState" TEXT;
ALTER TABLE "User" ADD COLUMN "targetBusinessType" TEXT;
