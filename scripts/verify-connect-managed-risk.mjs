/**
 * Sandbox-only verification of Managed Risk Connect account creation + direct Checkout.
 * Uses STRIPE_SECRET_KEY (must be sk_test_…). Never uses STRIPE_SECRET_KEY_LIVE.
 *
 * Run: node --import tsx ./scripts/verify-connect-managed-risk.mjs
 */
import "dotenv/config";
import Stripe from "stripe";

const PREVIEW = "2026-08-26.preview";
const PLATFORM_HINT = "acct_1TPPTn7SBwLxrmdE"; // Localgrowth sandbox

function requireTestSecret() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "Refusing to run: STRIPE_SECRET_KEY is not sk_test_. Use sandbox only."
    );
  }
  return key;
}

async function main() {
  const secret = requireTestSecret();
  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
  });

  const platform = await stripe.accounts.retrieve();
  console.log("platform.id", platform.id);
  if (platform.id !== PLATFORM_HINT) {
    console.warn(
      `Warning: expected sandbox ${PLATFORM_HINT}, got ${platform.id} (continuing if test mode)`
    );
  }
  if (platform.livemode) {
    throw new Error("Refusing: platform account is livemode");
  }

  console.log("\n=== 1) Create Managed Risk Express account (preview API) ===");
  // Docs: https://docs.stripe.com/connect/risk-management/managed-risk
  const created = await stripe.accounts.create(
    {
      country: "US",
      email: `managed-risk-verify+${Date.now()}@example.com`,
      controller: {
        stripe_dashboard: { type: "express" },
        losses: { payments: "stripe" },
        requirement_collection: "stripe",
        fees: { payer: "application" },
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        connectAccountCreation: "managed_risk_v2",
        verifyScript: "verify-connect-managed-risk",
      },
    },
    { apiVersion: PREVIEW }
  );

  console.log("created.id", created.id);
  console.log("created.controller (create response)", JSON.stringify(created.controller, null, 2));

  console.log("\n=== 2) Retrieve and confirm losses.payments ===");
  const retrieved = await stripe.accounts.retrieve(
    created.id,
    undefined,
    { apiVersion: PREVIEW }
  );
  const losses = retrieved.controller?.losses?.payments;
  const dashboard = retrieved.controller?.stripe_dashboard?.type;
  console.log("retrieved.controller.losses.payments", losses);
  console.log("retrieved.controller.stripe_dashboard.type", dashboard);
  console.log("charges_enabled", retrieved.charges_enabled);
  console.log("payouts_enabled", retrieved.payouts_enabled);

  if (losses !== "stripe") {
    throw new Error(
      `FAIL: expected controller.losses.payments=stripe, got ${String(losses)}`
    );
  }
  if (dashboard !== "express") {
    throw new Error(
      `FAIL: expected controller.stripe_dashboard.type=express, got ${String(dashboard)}`
    );
  }
  console.log("PASS: losses.payments=stripe and dashboard=express");

  // Attempt to update losses to application — documents Step 4 immutability.
  console.log("\n=== 3) Probe accounts.update losses.payments (Step 4 research) ===");
  try {
    await stripe.accounts.update(
      created.id,
      { controller: { losses: { payments: "application" } } },
      { apiVersion: PREVIEW }
    );
    const after = await stripe.accounts.retrieve(created.id, undefined, {
      apiVersion: PREVIEW,
    });
    console.log(
      "after update losses.payments",
      after.controller?.losses?.payments
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("accounts.update losses rejected (expected if immutable):", msg.slice(0, 300));
  }

  console.log("\n=== 4) Provision test account for charges (Account Link skip path) ===");
  // In test mode, complete onboarding via Account Link UI "Skip this account form",
  // or use Stripe's tokenized test bank + person updates where allowed.
  // For automation: try creating a PaymentIntent on the connected account after
  // requesting capabilities — if charges not enabled, create Account Link and
  // attempt Checkout once charges are enabled via test helper if available.

  let chargesEnabled = Boolean(retrieved.charges_enabled);

  if (!chargesEnabled) {
    // Stripe test mode: provide individual + external account for some controller configs.
    // Express/requirement_collection=stripe often still needs hosted onboarding.
    try {
      await stripe.accounts.update(
        created.id,
        {
          business_profile: {
            mcc: "5734",
            url: "https://localleadster.com",
            product_description: "Local business software and invoices",
          },
          individual: {
            first_name: "Jenny",
            last_name: "Rosen",
            email: created.email || "jenny.rosen@example.com",
            phone: "+10000000000",
            dob: { day: 1, month: 1, year: 1901 },
            address: {
              line1: "address_full_match",
              city: "San Francisco",
              state: "CA",
              postal_code: "94111",
              country: "US",
            },
            ssn_last_4: "0000",
          },
          external_account: "btok_us_verified",
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: "127.0.0.1",
          },
        },
        { apiVersion: PREVIEW }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log("KYC/API provision note:", msg.slice(0, 400));
    }

    const mid = await stripe.accounts.retrieve(created.id, undefined, {
      apiVersion: PREVIEW,
    });
    chargesEnabled = Boolean(mid.charges_enabled);
    console.log("after provision attempt charges_enabled", chargesEnabled);
    console.log("requirements.currently_due", mid.requirements?.currently_due?.slice(0, 12));
  }

  if (!chargesEnabled) {
    const link = await stripe.accountLinks.create({
      account: created.id,
      refresh_url: "https://example.com/reauth",
      return_url: "https://example.com/return",
      type: "account_onboarding",
    });
    console.log(
      "\nAccount not charge-ready via API (Express needs hosted onboarding;"
    );
    console.log(
      "headless Account Link is blocked by Stripe hCaptcha)."
    );
    console.log(
      "Open this link in your browser → Use test phone number → finish onboarding:"
    );
    console.log(link.url);
    console.log(
      "Then re-run: VERIFY_CONNECT_ACCOUNT_ID=" +
        created.id +
        " node --import tsx ./scripts/verify-connect-managed-risk.mjs"
    );

    const resumeId = process.env.VERIFY_CONNECT_ACCOUNT_ID?.trim();
    if (!resumeId) {
      console.log(
        "\nPARTIAL PASS: controller.losses.payments=stripe confirmed via retrieve."
      );
      console.log(
        "Payment/payout cycle pending human Account Link completion (hCaptcha)."
      );
      process.exitCode = 2;
      return;
    }
  }

  const accountId =
    chargesEnabled
      ? created.id
      : process.env.VERIFY_CONNECT_ACCOUNT_ID?.trim() || created.id;

  const ready = await stripe.accounts.retrieve(accountId, undefined, {
    apiVersion: PREVIEW,
  });
  if (!ready.charges_enabled) {
    throw new Error(`Account ${accountId} still not charges_enabled`);
  }
  if (ready.controller?.losses?.payments !== "stripe") {
    throw new Error(`Resume account ${accountId} losses.payments !== stripe`);
  }

  console.log("\n=== 5) Direct Checkout payment on connected account ===");
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 1500,
            product_data: { name: "Managed Risk verify invoice" },
          },
        },
      ],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      payment_intent_data: {
        metadata: { kind: "managed_risk_verify" },
      },
    },
    { stripeAccount: accountId }
  );
  console.log("checkout.session.id", session.id);
  console.log("checkout.session.url", session.url);

  // Complete payment without browser: create PaymentIntent directly (same direct-charge model).
  const pi = await stripe.paymentIntents.create(
    {
      amount: 1500,
      currency: "usd",
      payment_method: "pm_card_visa",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { kind: "managed_risk_verify_pi" },
    },
    { stripeAccount: accountId }
  );
  console.log("payment_intent.id", pi.id);
  console.log("payment_intent.status", pi.status);
  if (pi.status !== "succeeded") {
    throw new Error(`PaymentIntent not succeeded: ${pi.status}`);
  }

  console.log("\n=== 6) Balance / payout readiness ===");
  const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
  console.log(
    "available",
    balance.available.map((b) => `${b.amount} ${b.currency}`).join(", ")
  );
  console.log(
    "pending",
    balance.pending.map((b) => `${b.amount} ${b.currency}`).join(", ")
  );

  // Instant payout may not be available; create a standard payout if available > 0.
  const availUsd = balance.available.find((b) => b.currency === "usd")?.amount ?? 0;
  if (availUsd >= 100) {
    const payout = await stripe.payouts.create(
      { amount: Math.min(availUsd, 1500), currency: "usd" },
      { stripeAccount: accountId }
    );
    console.log("payout.id", payout.id, "status", payout.status);
  } else {
    console.log(
      "No available balance yet (common in test — funds pending). Payment succeeded; payout will follow Stripe test timing."
    );
  }

  console.log("\nFULL PASS: Managed Risk account + direct charge verified.");
  console.log("accountId", accountId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
