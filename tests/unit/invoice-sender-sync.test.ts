import { describe, expect, it } from "vitest";
import { defaultInvoiceSenderTemplate } from "@/lib/invoice-sender-template";
import {
  mergeInvoiceSenderTemplates,
  protectInvoiceSenderLogo,
} from "@/lib/invoice-sender-sync";

const logo =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwB9A//Z";

describe("invoice sender sync helpers", () => {
  it("restores logo from local when account template has none", () => {
    const remote = {
      ...defaultInvoiceSenderTemplate(),
      businessName: "Acme",
      logoDataUrl: null,
    };
    const local = {
      ...defaultInvoiceSenderTemplate(),
      businessName: "",
      logoDataUrl: logo,
    };
    const merged = mergeInvoiceSenderTemplates(remote, local);
    expect(merged.businessName).toBe("Acme");
    expect(merged.logoDataUrl).toBe(logo);
  });

  it("keeps account logo over empty local", () => {
    const remote = {
      ...defaultInvoiceSenderTemplate(),
      logoDataUrl: logo,
    };
    const local = defaultInvoiceSenderTemplate();
    expect(mergeInvoiceSenderTemplates(remote, local).logoDataUrl).toBe(logo);
  });

  it("protects known logo on auto-save unless clear is allowed", () => {
    const empty = { ...defaultInvoiceSenderTemplate(), logoDataUrl: null };
    expect(protectInvoiceSenderLogo(empty, logo).logoDataUrl).toBe(logo);
    expect(
      protectInvoiceSenderLogo(empty, logo, { allowClearLogo: true }).logoDataUrl
    ).toBeNull();
  });
});
