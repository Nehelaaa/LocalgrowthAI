/**
 * Configure Stripe Connect webhook destinations for invoice Pay now.
 * Creates (or updates) a Connect-scoped endpoint at the production webhook URL.
 * Does not print secrets.
 */
require("dotenv").config();
const Stripe = require("stripe");

const PROD_URL = "https://localleadster.com/api/stripe/webhook";

const PLATFORM_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.closed",
];

const CONNECT_EVENTS = [
  "account.updated",
  "account.application.deauthorized",
  "checkout.session.completed",
  "charge.refunded",
];

async function ensureEndpoints(label, secretKey) {
  if (!secretKey?.trim()) {
    console.log(`[${label}] skip — no secret key`);
    return { label, skipped: true };
  }
  const stripe = new Stripe(secretKey.trim(), { apiVersion: "2026-03-25.dahlia" });
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  const endpoints = list.data.filter((e) => e.url === PROD_URL);

  const platform = endpoints.find((e) => !e.connect);
  const connect = endpoints.find((e) => e.connect);

  const out = { label, mode: secretKey.startsWith("sk_live") ? "live" : "test", actions: [] };

  if (!platform) {
    const created = await stripe.webhookEndpoints.create({
      url: PROD_URL,
      enabled_events: PLATFORM_EVENTS,
      description: "LocalLeadster platform (subscriptions + billing)",
      api_version: "2026-03-25.dahlia",
    });
    out.actions.push(`created platform endpoint ${created.id}`);
    out.platformSecret = created.secret;
  } else {
    const missing = PLATFORM_EVENTS.filter((ev) => !platform.enabled_events.includes(ev) && !platform.enabled_events.includes("*"));
    if (missing.length || platform.status !== "enabled") {
      await stripe.webhookEndpoints.update(platform.id, {
        enabled_events: PLATFORM_EVENTS,
        disabled: false,
        description: platform.description || "LocalLeadster platform (subscriptions + billing)",
      });
      out.actions.push(`updated platform endpoint ${platform.id}`);
    } else {
      out.actions.push(`platform endpoint ok ${platform.id}`);
    }
  }

  if (!connect) {
    const created = await stripe.webhookEndpoints.create({
      url: PROD_URL,
      enabled_events: CONNECT_EVENTS,
      connect: true,
      description: "LocalLeadster Connect (invoice Pay now on connected accounts)",
      api_version: "2026-03-25.dahlia",
    });
    out.actions.push(`created CONNECT endpoint ${created.id}`);
    out.connectSecret = created.secret;
  } else {
    const missing = CONNECT_EVENTS.filter((ev) => !connect.enabled_events.includes(ev) && !connect.enabled_events.includes("*"));
    if (missing.length || connect.status !== "enabled") {
      await stripe.webhookEndpoints.update(connect.id, {
        enabled_events: CONNECT_EVENTS,
        disabled: false,
        description: "LocalLeadster Connect (invoice Pay now on connected accounts)",
      });
      out.actions.push(`updated CONNECT endpoint ${connect.id}`);
    } else {
      out.actions.push(`CONNECT endpoint ok ${connect.id}`);
    }
  }

  // Probe Connect capability: try creating a throwaway Express account then delete.
  try {
    const acct = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { probe: "connect_setup_check", delete_me: "1" },
    });
    out.actions.push(`Connect Express works (probe ${acct.id})`);
    try {
      await stripe.accounts.del(acct.id);
      out.actions.push("deleted probe Express account");
    } catch {
      out.actions.push("probe Express created (delete skipped — ok)");
    }
    out.connectReady = true;
  } catch (e) {
    out.connectReady = false;
    out.connectError = e instanceof Error ? e.message : String(e);
    out.actions.push(`Connect probe FAILED: ${out.connectError}`);
  }

  return out;
}

async function main() {
  const liveKey =
    process.env.STRIPE_SECRET_KEY_LIVE?.trim() ||
    (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")
      ? process.env.STRIPE_SECRET_KEY.trim()
      : "");
  const testKey =
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test")
      ? process.env.STRIPE_SECRET_KEY.trim()
      : process.env.STRIPE_SECRET_KEY_TEST?.trim() || "";

  // Prefer pairing: if STRIPE_SECRET_KEY is test, use it as test; live alias as live.
  const results = [];
  if (liveKey) results.push(await ensureEndpoints("LIVE", liveKey));
  if (testKey) results.push(await ensureEndpoints("TEST", testKey));
  if (!liveKey && !testKey) {
    results.push(await ensureEndpoints("DEFAULT", process.env.STRIPE_SECRET_KEY));
  }

  for (const r of results) {
    console.log("\n===", r.label, r.mode || "", "===");
    for (const a of r.actions || []) console.log("-", a);
    if (r.platformSecret) {
      console.log("NEW platform signing secret (save as STRIPE_WEBHOOK_SECRET for this mode):", r.platformSecret);
    }
    if (r.connectSecret) {
      console.log(
        "NEW Connect signing secret — IMPORTANT: Stripe issues a DIFFERENT secret per endpoint."
      );
      console.log(
        "  Your app currently has ONE STRIPE_WEBHOOK_SECRET. Options:"
      );
      console.log(
        "  1) Prefer routing both destinations through one endpoint ID if Stripe allows (not always)."
      );
      console.log(
        "  2) Or set STRIPE_CONNECT_WEBHOOK_SECRET to this value and update the webhook handler to try both secrets."
      );
      console.log("  Connect secret:", r.connectSecret);
    }
    if (r.connectReady === false) {
      console.log("Connect not ready. Finish platform profile:");
      console.log("  https://dashboard.stripe.com/connect/accounts/overview");
      console.log("  https://dashboard.stripe.com/settings/connect");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
