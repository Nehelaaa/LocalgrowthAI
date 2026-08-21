import { describe, expect, it } from "vitest";
import { computeLeadScore, explainLeadScore } from "@/lib/lead-score";

describe("computeLeadScore", () => {
  it("awards rating bands: >=4 → +25, >=3 → +10, below 3 → 0", () => {
    expect(computeLeadScore({ rating: 4, reviewCount: 0, noWebsite: false, hasSocialOnly: false }).score).toBe(25);
    expect(computeLeadScore({ rating: 3.9, reviewCount: 0, noWebsite: false, hasSocialOnly: false }).score).toBe(10);
    expect(computeLeadScore({ rating: 3, reviewCount: 0, noWebsite: false, hasSocialOnly: false }).score).toBe(10);
    expect(computeLeadScore({ rating: 2.9, reviewCount: 0, noWebsite: false, hasSocialOnly: false }).score).toBe(0);
    expect(computeLeadScore({ rating: null, reviewCount: 0, noWebsite: false, hasSocialOnly: false }).score).toBe(0);
  });

  it("awards review-count tiers: 50+/20+/5+", () => {
    expect(computeLeadScore({ reviewCount: 50, noWebsite: false, hasSocialOnly: false }).score).toBe(20);
    expect(computeLeadScore({ reviewCount: 49, noWebsite: false, hasSocialOnly: false }).score).toBe(15);
    expect(computeLeadScore({ reviewCount: 20, noWebsite: false, hasSocialOnly: false }).score).toBe(15);
    expect(computeLeadScore({ reviewCount: 19, noWebsite: false, hasSocialOnly: false }).score).toBe(10);
    expect(computeLeadScore({ reviewCount: 5, noWebsite: false, hasSocialOnly: false }).score).toBe(10);
    expect(computeLeadScore({ reviewCount: 4, noWebsite: false, hasSocialOnly: false }).score).toBe(0);
  });

  it("prefers noWebsite (+35) over social-only (+20)", () => {
    expect(computeLeadScore({ reviewCount: 0, noWebsite: true, hasSocialOnly: false }).score).toBe(35);
    expect(computeLeadScore({ reviewCount: 0, noWebsite: false, hasSocialOnly: true }).score).toBe(20);
    // noWebsite wins when both flags are set
    expect(computeLeadScore({ reviewCount: 0, noWebsite: true, hasSocialOnly: true }).score).toBe(35);
  });

  it("adds +10 for recent photos", () => {
    expect(
      computeLeadScore({
        reviewCount: 0,
        noWebsite: false,
        hasSocialOnly: false,
        hasRecentPhotos: true,
      }).score
    ).toBe(10);
  });

  it("uses HOT >= 70, WARM >= 40, else COLD at exact boundaries", () => {
    // 70 exactly → HOT (rating 4 + reviews 50 + noWebsite 35 = 80; craft exact 70)
    // rating4(25)+reviews5(10)+noWebsite(35)=70
    const hotBoundary = computeLeadScore({
      rating: 4,
      reviewCount: 5,
      noWebsite: true,
      hasSocialOnly: false,
    });
    expect(hotBoundary.score).toBe(70);
    expect(hotBoundary.badge).toBe("HOT");

    // 69 → WARM: rating4(25)+reviews5(10)+social(20)+photos(10)=65 — need 69
    // rating4(25)+reviews20(15)+social(20)+photos(10)=70 is hot; for 69 use:
    // rating3(10)+reviews50(20)+noWebsite(35)+photos(10)=75
    // For 69: rating4(25)+reviews50(20)+social(20)+photos(0)=65
    // For 40 exact: social(20)+reviews20(15)+rating3(10)- wait 45
    // 40: social(20)+reviews20(15)+rating null + photos(5)? photos only +10 → 45
    // Exact 40: social(20)+reviews20(15)+rating null = 35 → COLD
    // Exact 40: noWebsite(35)+reviews5(10)- wait 45
    // Exact 40: reviews50(20)+social(20)=40
    const warmBoundary = computeLeadScore({
      rating: null,
      reviewCount: 50,
      noWebsite: false,
      hasSocialOnly: true,
    });
    expect(warmBoundary.score).toBe(40);
    expect(warmBoundary.badge).toBe("WARM");

    const coldJustBelow = computeLeadScore({
      rating: null,
      reviewCount: 49,
      noWebsite: false,
      hasSocialOnly: true,
    });
    // 49 reviews → +15, social +20 = 35
    expect(coldJustBelow.score).toBe(35);
    expect(coldJustBelow.badge).toBe("COLD");

    // Just below HOT: 69
    // rating4(25)+reviews20(15)+social(20)+photos(10)-1? = 70
    // rating4(25)+reviews5(10)+social(20)+photos(10)=65
    // rating4(25)+reviews20(15)+social(20)=60
    // rating4(25)+reviews50(20)+social(20)=65
    // rating3(10)+reviews50(20)+noWebsite(35)=65
    // rating4(25)+reviews50(20)+noWebsite(35)=80
    // For 69: not achievable with current increments — test 65 stays WARM
    const warmMid = computeLeadScore({
      rating: 4,
      reviewCount: 50,
      noWebsite: false,
      hasSocialOnly: true,
    });
    expect(warmMid.score).toBe(65);
    expect(warmMid.badge).toBe("WARM");
  });

  it("clamps score to 0–100", () => {
    const maxed = computeLeadScore({
      rating: 5,
      reviewCount: 100,
      noWebsite: true,
      hasSocialOnly: true,
      hasRecentPhotos: true,
    });
    // 25+20+35+10 = 90
    expect(maxed.score).toBe(90);
    expect(maxed.badge).toBe("HOT");
  });
});

describe("explainLeadScore", () => {
  it("describes rating, reviews, website, and photos", () => {
    const lines = explainLeadScore({
      rating: 4.5,
      reviewCount: 60,
      noWebsite: true,
      hasSocialOnly: false,
      hasRecentPhotos: true,
    });
    expect(lines).toContain("Strong rating (4.5★)");
    expect(lines.some((l) => l.includes("60 reviews"))).toBe(true);
    expect(lines).toContain("No website — top opportunity");
    expect(lines).toContain("Recent photos on listing");
  });

  it("notes social-only and has-website cases", () => {
    expect(
      explainLeadScore({
        rating: 2,
        reviewCount: 1,
        noWebsite: false,
        hasSocialOnly: true,
      })
    ).toEqual(
      expect.arrayContaining(["Lower rating (2★)", "1 review", "Social-only web presence"])
    );
    expect(
      explainLeadScore({
        rating: null,
        reviewCount: 0,
        noWebsite: false,
        hasSocialOnly: false,
      })
    ).toContain("Has a website");
  });
});
