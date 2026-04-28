/**
 * One-way copy: SQLite (legacy prisma/dev.db) → PostgreSQL (Neon / DATABASE_URL).
 *
 * Usage (from localgrowth-app):
 *   npm run db:migrate-from-sqlite -- --force
 *
 * --force  : wipe existing rows in Neon for these tables, then import (required if Neon has data)
 * --dry-run: show row counts only, no writes
 *
 * Requires: better-sqlite3, dev.db present, DATABASE_URL pointing at Postgres in .env
 */

const path = require("node:path");
const fs = require("node:fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const SQLITE_PATH = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, "..", "prisma", "dev.db");

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const FORCE = args.has("--force");

function toDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? new Date() : v;
  }
  if (typeof v === "number" && !isNaN(v)) {
    // sqlite can store ms or seconds
    const d = v < 1e12 ? new Date(v * 1000) : new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? new Date() : d;
}

function toJson(v) {
  if (v == null || v === "") return null;
  if (typeof v === "object" && v !== null && !Array.isArray(v)) return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v === 0 || v === "0") return false;
  if (v === 1 || v === "1") return true;
  return Boolean(v);
}

function toNum(v, isInt) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isInt ? Math.round(n) : n;
}

function tableExists(sqlite, name) {
  const r = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return Boolean(r);
}

function countAll(sqlite, name) {
  if (!tableExists(sqlite, name)) return 0;
  return sqlite.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get().c;
}

async function wipeNeon(prisma) {
  // Children first (FK order)
  await prisma.outreach.deleteMany();
  await prisma.demoPage.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.tradesJob.deleteMany();
  await prisma.tradesCustomer.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.ownerBillingEvent.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.aiDayUsage.deleteMany();
  await prisma.searchDayUsage.deleteMany();
  await prisma.featureFlagOverride.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.placeSearchCache.deleteMany();
  await prisma.verificationToken.deleteMany();
}

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("postgresql")) {
    console.error("DATABASE_URL must be a postgresql:// connection (Neon).");
    process.exit(1);
  }

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`SQLite file not found: ${SQLITE_PATH}`);
    console.error("Copy your old dev.db there or set SQLITE_PATH.");
    process.exit(1);
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
  const prisma = new PrismaClient();

  const tables = [
    "User",
    "FeatureFlag",
    "Business",
    "PlaceSearchCache",
    "VerificationToken",
    "Account",
    "Session",
    "PasswordResetToken",
    "AiDayUsage",
    "SearchDayUsage",
    "FeatureFlagOverride",
    "TradesCustomer",
    "OwnerBillingEvent",
    "ActivityLog",
    "Lead",
    "Outreach",
    "DemoPage",
    "TradesJob",
  ];
  const total = tables.reduce((a, t) => a + countAll(sqlite, t), 0);
  console.log(`SQLite ${SQLITE_PATH}: ~${total} rows across known tables.`);

  if (DRY) {
    sqlite.close();
    await prisma.$disconnect();
    return;
  }

  const existing = await prisma.user.count();
  if (existing > 0 && !FORCE) {
    console.error(
      `Neon already has ${existing} user(s). Re-run with --force to delete all app data in Neon and import from SQLite, or use a fresh database.`
    );
    sqlite.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  if (existing > 0 && FORCE) {
    console.log("Wiping Neon (all Prisma tables)…");
    await wipeNeon(prisma);
  }

  // ---- import: same order as parents before children
  const u = tableExists(sqlite, "User")
    ? sqlite.prepare(`SELECT * FROM "User"`).all()
    : [];
  for (const r of u) {
    await prisma.user.create({
      data: {
        id: r.id,
        email: r.email,
        name: r.name,
        image: r.image,
        passwordHash: r.passwordHash,
        role: r.role,
        disabled: toBool(r.disabled),
        emailVerified: toDate(r.emailVerified),
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
        grandfatheredPro: toBool(r.grandfatheredPro),
        plan: r.plan ?? "free",
        subscriptionStatus: r.subscriptionStatus,
        subscriptionPeriodEnd: toDate(r.subscriptionPeriodEnd),
        stripeCustomerId: r.stripeCustomerId,
        stripeSubscriptionId: r.stripeSubscriptionId,
        onboardingComplete: toBool(
          r.onboardingComplete === null || r.onboardingComplete === undefined
            ? true
            : r.onboardingComplete
        ),
        profession: r.profession,
      },
    });
  }
  console.log(`Imported ${u.length} users.`);

  const ff = tableExists(sqlite, "FeatureFlag")
    ? sqlite.prepare(`SELECT * FROM "FeatureFlag"`).all()
    : [];
  for (const r of ff) {
    await prisma.featureFlag.create({
      data: {
        id: r.id,
        key: r.key,
        label: r.label,
        freeEnabled: toBool(r.freeEnabled),
        proEnabled: toBool(r.proEnabled),
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${ff.length} feature flags.`);

  const bus = tableExists(sqlite, "Business")
    ? sqlite.prepare(`SELECT * FROM "Business"`).all()
    : [];
  for (const r of bus) {
    await prisma.business.create({
      data: {
        id: r.id,
        placeId: r.placeId,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        phone: r.phone,
        website: r.website,
        rating: toNum(r.rating, false),
        reviewCount: toNum(r.reviewCount, true) ?? 0,
        googleMapsUrl: r.googleMapsUrl,
        businessType: r.businessType,
        lat: toNum(r.lat, false),
        lng: toNum(r.lng, false),
        hasSocialOnly: toBool(r.hasSocialOnly),
        photoUrl: r.photoUrl,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${bus.length} businesses.`);

  const psc = tableExists(sqlite, "PlaceSearchCache")
    ? sqlite.prepare(`SELECT * FROM "PlaceSearchCache"`).all()
    : [];
  for (const r of psc) {
    await prisma.placeSearchCache.create({
      data: {
        id: r.id,
        cacheKey: r.cacheKey,
        payload: r.payload,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${psc.length} place search cache rows.`);

  const vt = tableExists(sqlite, "VerificationToken")
    ? sqlite.prepare(`SELECT * FROM "VerificationToken"`).all()
    : [];
  for (const r of vt) {
    await prisma.verificationToken.create({
      data: {
        identifier: r.identifier,
        token: r.token,
        expires: toDate(r.expires) || new Date(),
      },
    });
  }
  console.log(`Imported ${vt.length} verification tokens.`);

  const acc = tableExists(sqlite, "Account")
    ? sqlite.prepare(`SELECT * FROM "Account"`).all()
    : [];
  for (const r of acc) {
    await prisma.account.create({
      data: {
        id: r.id,
        userId: r.userId,
        type: r.type,
        provider: r.provider,
        providerAccountId: r.providerAccountId,
        refresh_token: r.refresh_token,
        access_token: r.access_token,
        expires_at: toNum(r.expires_at, true),
        token_type: r.token_type,
        scope: r.scope,
        id_token: r.id_token,
        session_state: r.session_state,
      },
    });
  }
  console.log(`Imported ${acc.length} accounts.`);

  const ses = tableExists(sqlite, "Session")
    ? sqlite.prepare(`SELECT * FROM "Session"`).all()
    : [];
  for (const r of ses) {
    await prisma.session.create({
      data: {
        id: r.id,
        sessionToken: r.sessionToken,
        userId: r.userId,
        expires: toDate(r.expires) || new Date(),
      },
    });
  }
  console.log(`Imported ${ses.length} sessions.`);

  const prt = tableExists(sqlite, "PasswordResetToken")
    ? sqlite.prepare(`SELECT * FROM "PasswordResetToken"`).all()
    : [];
  for (const r of prt) {
    await prisma.passwordResetToken.create({
      data: {
        id: r.id,
        token: r.token,
        userId: r.userId,
        expiresAt: toDate(r.expiresAt) || new Date(),
        createdAt: toDate(r.createdAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${prt.length} password reset tokens.`);

  const adu = tableExists(sqlite, "AiDayUsage")
    ? sqlite.prepare(`SELECT * FROM "AiDayUsage"`).all()
    : [];
  for (const r of adu) {
    await prisma.aiDayUsage.create({
      data: {
        id: r.id,
        userId: r.userId,
        day: r.day,
        count: toNum(r.count, true) ?? 0,
      },
    });
  }
  console.log(`Imported ${adu.length} AI day usage rows.`);

  const sdu = tableExists(sqlite, "SearchDayUsage")
    ? sqlite.prepare(`SELECT * FROM "SearchDayUsage"`).all()
    : [];
  for (const r of sdu) {
    await prisma.searchDayUsage.create({
      data: {
        id: r.id,
        userId: r.userId,
        day: r.day,
        count: toNum(r.count, true) ?? 0,
      },
    });
  }
  console.log(`Imported ${sdu.length} search day usage rows.`);

  const ffo = tableExists(sqlite, "FeatureFlagOverride")
    ? sqlite.prepare(`SELECT * FROM "FeatureFlagOverride"`).all()
    : [];
  for (const r of ffo) {
    await prisma.featureFlagOverride.create({
      data: {
        id: r.id,
        featureId: r.featureId,
        userId: r.userId,
        enabled: toBool(r.enabled),
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${ffo.length} feature flag overrides.`);

  const tc = tableExists(sqlite, "TradesCustomer")
    ? sqlite.prepare(`SELECT * FROM "TradesCustomer"`).all()
    : [];
  for (const r of tc) {
    await prisma.tradesCustomer.create({
      data: {
        id: r.id,
        userId: r.userId,
        name: r.name,
        phone: r.phone,
        notes: r.notes,
        issues: r.issues,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${tc.length} trades customers.`);

  const obe = tableExists(sqlite, "OwnerBillingEvent")
    ? sqlite.prepare(`SELECT * FROM "OwnerBillingEvent"`).all()
    : [];
  for (const r of obe) {
    await prisma.ownerBillingEvent.create({
      data: {
        id: r.id,
        createdAt: toDate(r.createdAt) || new Date(),
        kind: r.kind,
        severity: r.severity ?? "info",
        title: r.title,
        body: r.body,
        stripeCustomerId: r.stripeCustomerId,
        stripeSubscriptionId: r.stripeSubscriptionId,
        stripeInvoiceId: r.stripeInvoiceId,
        stripeChargeId: r.stripeChargeId,
        userId: r.userId,
        metadata: toJson(r.metadata),
      },
    });
  }
  console.log(`Imported ${obe.length} owner billing events.`);

  const al = tableExists(sqlite, "ActivityLog")
    ? sqlite.prepare(`SELECT * FROM "ActivityLog"`).all()
    : [];
  for (const r of al) {
    await prisma.activityLog.create({
      data: {
        id: r.id,
        userId: r.userId,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        metadata: toJson(r.metadata),
        createdAt: toDate(r.createdAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${al.length} activity logs.`);

  const leads = tableExists(sqlite, "Lead")
    ? sqlite.prepare(`SELECT * FROM "Lead"`).all()
    : [];
  for (const r of leads) {
    await prisma.lead.create({
      data: {
        id: r.id,
        userId: r.userId,
        businessId: r.businessId,
        leadScore: toNum(r.leadScore, true) ?? 0,
        badge: r.badge,
        contactStatus: r.contactStatus,
        notes: r.notes,
        followUpDate: toDate(r.followUpDate),
        tags: r.tags,
        opportunityInsights: r.opportunityInsights,
        revenueEstimate: r.revenueEstimate,
        websiteQuote: r.websiteQuote,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${leads.length} leads.`);

  const out = tableExists(sqlite, "Outreach")
    ? sqlite.prepare(`SELECT * FROM "Outreach"`).all()
    : [];
  for (const r of out) {
    await prisma.outreach.create({
      data: {
        id: r.id,
        leadId: r.leadId,
        type: r.type,
        content: r.content,
        generatedAt: toDate(r.generatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${out.length} outreaches.`);

  const dp = tableExists(sqlite, "DemoPage")
    ? sqlite.prepare(`SELECT * FROM "DemoPage"`).all()
    : [];
  for (const r of dp) {
    await prisma.demoPage.create({
      data: {
        id: r.id,
        leadId: r.leadId,
        slug: r.slug,
        htmlContent: r.htmlContent,
        createdAt: toDate(r.createdAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${dp.length} demo pages.`);

  const tj = tableExists(sqlite, "TradesJob")
    ? sqlite.prepare(`SELECT * FROM "TradesJob"`).all()
    : [];
  for (const r of tj) {
    await prisma.tradesJob.create({
      data: {
        id: r.id,
        userId: r.userId,
        customerId: r.customerId,
        jobType: r.jobType,
        status: r.status,
        priceCents: toNum(r.priceCents, true) ?? 0,
        paid: toBool(r.paid),
        scheduledAt: toDate(r.scheduledAt),
        notes: r.notes,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      },
    });
  }
  console.log(`Imported ${tj.length} trades jobs.`);

  sqlite.close();
  await prisma.$disconnect();
  console.log("Done. Data from SQLite is now in Neon (for the tables that existed in your .db file).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
