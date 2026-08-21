import { describe, expect, it } from "vitest";
import {
  applyPreset,
  competitionLevel,
  defaultPlaceFilterState,
  filterAndSortPlaces,
  opportunityTier,
  scoreOpportunity,
  scoreValue,
  type PlaceRow,
} from "@/lib/place-search-scoring";

function place(partial: Partial<PlaceRow> & Pick<PlaceRow, "placeId" | "name">): PlaceRow {
  return {
    address: "1 Main St",
    reviewCount: 0,
    googleMapsUrl: "https://maps.google.com/?cid=1",
    hasSocialOnly: false,
    noWebsite: false,
    ...partial,
  };
}

describe("scoreOpportunity / tiers", () => {
  it("scores no-website listings higher than real websites", () => {
    const none = scoreOpportunity(place({ placeId: "a", name: "A", noWebsite: true }));
    const real = scoreOpportunity(place({ placeId: "b", name: "B", noWebsite: false }));
    expect(none).toBeGreaterThan(real);
    expect(opportunityTier(place({ placeId: "a", name: "A", noWebsite: true, reviewCount: 5 }))).toBe(
      "high"
    );
  });
});

describe("scoreValue / competition", () => {
  it("gives higher value to well-reviewed listings", () => {
    const hot = scoreValue(place({ placeId: "a", name: "A", reviewCount: 200, rating: 4.8 }));
    const cold = scoreValue(place({ placeId: "b", name: "B", reviewCount: 2, rating: 3 }));
    expect(hot).toBeGreaterThan(cold);
  });

  it("marks high competition for strong listings", () => {
    expect(
      competitionLevel(place({ placeId: "a", name: "A", reviewCount: 100, rating: 4.5 }))
    ).toBe("high");
    expect(competitionLevel(place({ placeId: "b", name: "B", reviewCount: 10, rating: 4 }))).toBe(
      "low"
    );
  });
});

describe("filterAndSortPlaces", () => {
  const places = [
    place({ placeId: "1", name: "Alpha Plumbing", noWebsite: true, reviewCount: 8, rating: 4 }),
    place({
      placeId: "2",
      name: "Beta HVAC",
      noWebsite: false,
      reviewCount: 120,
      rating: 4.8,
      website: "https://beta.com",
    }),
    place({
      placeId: "3",
      name: "Gamma Social",
      hasSocialOnly: true,
      reviewCount: 3,
      website: "https://instagram.com/gamma",
    }),
  ];

  it("filters by name query and websiteMode=no", () => {
    const s = defaultPlaceFilterState();
    s.nameQuery = "alpha";
    expect(filterAndSortPlaces(places, s).map((p) => p.placeId)).toEqual(["1"]);

    s.nameQuery = "";
    s.websiteMode = "no";
    expect(filterAndSortPlaces(places, s).every((p) => p.noWebsite)).toBe(true);
  });

  it("sorts by opportunity descending", () => {
    const s = defaultPlaceFilterState();
    s.sort = "opportunity";
    const sorted = filterAndSortPlaces(places, s);
    const scores = sorted.map((p) => scoreOpportunity(p));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe("applyPreset", () => {
  it("configures easy_wins for no-website + high opportunity", () => {
    const s = applyPreset("easy_wins");
    expect(s.websiteMode).toBe("no");
    expect(s.opportunityHigh).toBe(true);
    expect(s.sort).toBe("opportunity");
  });
});
