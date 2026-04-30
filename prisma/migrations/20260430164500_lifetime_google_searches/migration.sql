-- Starter search quota: track lifetime Google API searches on User (not per-day).
ALTER TABLE "User" ADD COLUMN "lifetimeGoogleSearches" INTEGER NOT NULL DEFAULT 0;

-- Best-effort backfill from historical per-day counters (existing installs).
UPDATE "User" u
SET "lifetimeGoogleSearches" = COALESCE((
  SELECT SUM(s."count")::int
  FROM "SearchDayUsage" s
  WHERE s."userId" = u.id
), 0);
