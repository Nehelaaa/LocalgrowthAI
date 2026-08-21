import { describe, expect, it } from "vitest";
import { formatMoneyUSD, parseMoneyFromQuote } from "@/lib/invoice-money";
import { parseWebsitePrice } from "@/lib/parse-website-price";

describe("parseMoneyFromQuote", () => {
  it("returns 0 for empty / garbage", () => {
    expect(parseMoneyFromQuote("")).toBe(0);
    expect(parseMoneyFromQuote("   ")).toBe(0);
    expect(parseMoneyFromQuote("abc")).toBe(0);
    expect(parseMoneyFromQuote("$")).toBe(0);
  });

  it("parses $3,200 and plain digits", () => {
    expect(parseMoneyFromQuote("$3,200")).toBe(3200);
    expect(parseMoneyFromQuote("3200")).toBe(3200);
    expect(parseMoneyFromQuote("$3,200.50")).toBe(3200.5);
  });

  it("parses k / m suffixes", () => {
    expect(parseMoneyFromQuote("3.5k")).toBe(3500);
    expect(parseMoneyFromQuote("1.2m")).toBe(1_200_000);
  });
});

describe("formatMoneyUSD", () => {
  it("formats with two fraction digits", () => {
    expect(formatMoneyUSD(0)).toMatch(/\$0\.00/);
    expect(formatMoneyUSD(3200)).toMatch(/3,200\.00|3200\.00/);
  });
});

describe("parseWebsitePrice", () => {
  it("returns 0 for null/empty/garbage", () => {
    expect(parseWebsitePrice(null)).toBe(0);
    expect(parseWebsitePrice(undefined)).toBe(0);
    expect(parseWebsitePrice("")).toBe(0);
    expect(parseWebsitePrice("nope")).toBe(0);
  });

  it("parses $3,200 and 3200", () => {
    expect(parseWebsitePrice("$3,200")).toBe(3200);
    expect(parseWebsitePrice("3200")).toBe(3200);
  });

  it("parses k suffix", () => {
    expect(parseWebsitePrice("3.5k")).toBe(3500);
  });
});
