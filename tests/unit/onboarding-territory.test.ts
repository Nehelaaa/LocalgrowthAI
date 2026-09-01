import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_MAX_LENGTH,
  hasDemoTemplateForType,
} from "@/lib/business-types";
import { isUsStateCode } from "@/lib/us-states";

describe("isUsStateCode", () => {
  it("accepts valid codes regardless of case or padding", () => {
    expect(isUsStateCode("TX")).toBe(true);
    expect(isUsStateCode("tx")).toBe(true);
    expect(isUsStateCode("  ca  ")).toBe(true);
  });

  it("rejects anything that is not a real state code", () => {
    expect(isUsStateCode("")).toBe(false);
    expect(isUsStateCode("ZZ")).toBe(false);
    expect(isUsStateCode("Texas")).toBe(false);
  });
});

describe("business types shared between search and onboarding", () => {
  it("exposes a non-empty, lowercase, duplicate-free list", () => {
    expect(BUSINESS_TYPES.length).toBeGreaterThan(0);
    for (const t of BUSINESS_TYPES) {
      expect(t).toBe(t.toLowerCase());
    }
    expect(new Set(BUSINESS_TYPES).size).toBe(BUSINESS_TYPES.length);
  });

  it("keeps every option inside the length the search API accepts", () => {
    for (const t of BUSINESS_TYPES) {
      expect(t.length).toBeLessThanOrEqual(BUSINESS_TYPE_MAX_LENGTH);
    }
  });
});

describe("hasDemoTemplateForType", () => {
  it("matches template-backed niches case- and whitespace-insensitively", () => {
    expect(hasDemoTemplateForType("hair salon")).toBe(true);
    expect(hasDemoTemplateForType("  Hair Salon ")).toBe(true);
    expect(hasDemoTemplateForType("AUTO REPAIR")).toBe(true);
  });

  it("returns false for niches with no template and for blanks", () => {
    expect(hasDemoTemplateForType("lawyer")).toBe(false);
    expect(hasDemoTemplateForType("")).toBe(false);
  });

  it("only claims templates for types the search form actually offers", () => {
    const offered = new Set<string>(BUSINESS_TYPES);
    for (const t of BUSINESS_TYPES.filter(hasDemoTemplateForType)) {
      expect(offered.has(t)).toBe(true);
    }
  });
});
