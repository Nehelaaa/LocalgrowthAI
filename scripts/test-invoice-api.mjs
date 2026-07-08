/**
 * Invoice draft + API client smoke tests (no DB).
 */
import {
  leadInvoiceDraftV1Schema,
  parseLeadInvoiceDraft,
  serializeLeadInvoiceDraftStable,
} from "../src/lib/lead-invoice-draft.ts";

const sampleDraft = {
  v: 1,
  clientName: "WestWilshireNeuro",
  clientAddress: "123 Main St",
  lineItems: [
    { description: "Website build", amount: 6000 },
    { description: "Deployment", amount: 0 },
  ],
  notes: "Net 30",
  taxPercent: 0,
  discountAmount: 3200,
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const parsed = leadInvoiceDraftV1Schema.safeParse(sampleDraft);
assert(parsed.success, "sample draft should validate");

const roundTrip = parseLeadInvoiceDraft(parsed.data);
assert(roundTrip?.clientName === sampleDraft.clientName, "parseLeadInvoiceDraft round-trip");

const stable = serializeLeadInvoiceDraftStable(sampleDraft);
const stable2 = serializeLeadInvoiceDraftStable({ ...sampleDraft });
assert(stable === stable2, "serializeLeadInvoiceDraftStable should be deterministic");

const bad = leadInvoiceDraftV1Schema.safeParse({ v: 2, clientName: "x" });
assert(!bad.success, "invalid draft version should fail");

console.log("✓ invoice draft schema + serialization");
console.log("All invoice API unit checks passed.");
