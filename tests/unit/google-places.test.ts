import { describe, expect, it } from "vitest";
import { extractCityState, isSocialOnlyWebsite } from "@/lib/google-places";

describe("extractCityState", () => {
  it("parses a typical US formatted address", () => {
    expect(extractCityState("123 Main St, Arlington, MA 02476, USA")).toEqual({
      city: "Arlington",
      state: "MA",
    });
  });

  it("handles USA / US / United States suffix present or absent", () => {
    expect(extractCityState("10 Oak Ave, Boston, MA 02108")).toEqual({
      city: "Boston",
      state: "MA",
    });
    expect(extractCityState("10 Oak Ave, Boston, MA 02108, US")).toEqual({
      city: "Boston",
      state: "MA",
    });
    expect(extractCityState("10 Oak Ave, Boston, MA 02108, United States")).toEqual({
      city: "Boston",
      state: "MA",
    });
  });

  it("strips ZIP+4 from the state segment", () => {
    expect(extractCityState("1 A St, Cambridge, MA 02139-0001")).toEqual({
      city: "Cambridge",
      state: "MA",
    });
  });

  it("returns empty object for too-short or no-state strings", () => {
    expect(extractCityState("Nowhere")).toEqual({});
    expect(extractCityState("USA")).toEqual({});
  });

  it("keeps multi-word city names", () => {
    expect(extractCityState("9 Pier, New York, NY 10001, USA")).toEqual({
      city: "New York",
      state: "NY",
    });
  });
});

describe("isSocialOnlyWebsite", () => {
  it("returns false for empty / null", () => {
    expect(isSocialOnlyWebsite(null)).toBe(false);
    expect(isSocialOnlyWebsite(undefined)).toBe(false);
    expect(isSocialOnlyWebsite("")).toBe(false);
  });

  it("detects social domains case-insensitively", () => {
    expect(isSocialOnlyWebsite("https://www.Instagram.com/biz")).toBe(true);
    expect(isSocialOnlyWebsite("HTTPS://FACEBOOK.COM/pages/x")).toBe(true);
    expect(isSocialOnlyWebsite("https://x.com/handle")).toBe(true);
    expect(isSocialOnlyWebsite("https://www.linkedin.com/company/x")).toBe(true);
    expect(isSocialOnlyWebsite("https://fb.com/x")).toBe(true);
  });

  it("returns false for real business sites", () => {
    expect(isSocialOnlyWebsite("https://joesplumbing.com")).toBe(false);
    expect(isSocialOnlyWebsite("https://www.mysite.io/contact")).toBe(false);
  });
});
