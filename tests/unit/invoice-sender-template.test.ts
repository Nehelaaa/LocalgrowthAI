import { describe, expect, it } from "vitest";
import {
  invoiceSenderTemplateHasUserContent,
  parseInvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";

describe("invoice-sender-template", () => {
  it("parses a saved logo data URL", () => {
    const logo =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwB9A//Z";
    const t = parseInvoiceSenderTemplate({
      businessName: "Acme",
      logoDataUrl: logo,
      templateId: "classic",
      accentHex: "#0f766e",
      density: "compact",
      documentTitle: "Invoice",
      footerPhrase: "Thank you for your business.",
    });
    expect(t.businessName).toBe("Acme");
    expect(t.logoDataUrl).toBe(logo);
    expect(invoiceSenderTemplateHasUserContent(t)).toBe(true);
  });

  it("rejects non-image logo payloads", () => {
    const t = parseInvoiceSenderTemplate({
      logoDataUrl: "javascript:alert(1)",
    });
    expect(t.logoDataUrl).toBeNull();
  });
});
