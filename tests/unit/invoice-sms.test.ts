import { describe, expect, it } from "vitest";
import {
  buildInvoiceSmsBody,
  buildInvoiceSmsHref,
  normalizeSmsPhone,
} from "@/lib/invoice-sms";

describe("invoice-sms", () => {
  it("normalizes phone digits and keeps +", () => {
    expect(normalizeSmsPhone("(555) 123-4567")).toBe("5551234567");
    expect(normalizeSmsPhone("+1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizeSmsPhone("  ")).toBe("");
  });

  it("builds sms href with optional recipient", () => {
    expect(buildInvoiceSmsHref("555-0100", "Hello")).toBe(
      `sms:5550100?body=${encodeURIComponent("Hello")}`
    );
    expect(buildInvoiceSmsHref("", "Hello")).toBe(
      `sms:?body=${encodeURIComponent("Hello")}`
    );
  });

  it("builds a short SMS body with the view URL", () => {
    const body = buildInvoiceSmsBody({
      businessName: "Acme Co",
      invoiceNumber: "INV-1",
      viewUrl: "https://example.com/i/abc",
    });
    expect(body).toContain("INV-1");
    expect(body).toContain("Acme Co");
    expect(body).toContain("https://example.com/i/abc");
  });
});
