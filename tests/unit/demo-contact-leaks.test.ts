import { describe, expect, it } from "vitest";
import {
  expandTemplateBrandPhrases,
  findContactDetailLeaks,
  replaceSourceContactDetails,
} from "@/lib/demo-templates/personalize-branding";
import type { DemoTemplateVars } from "@/lib/demo-templates/types";

const vars: DemoTemplateVars = {
  business_name: "Bella Hair Studio",
  business_name_short: "Bella Hair",
  phone: "(512) 555-0142",
  phone_tel: "+15125550142",
  phone_display: "(512) 555-0142",
  address: "1200 S Congress Ave",
  street: "1200 S Congress Ave",
  location: "Austin, TX",
  city: "Austin",
  state: "TX",
  rating: "4.6",
  review_count: "84",
  hero_image: "",
  maps_url: "#contact",
  category_label: "hair salon",
  tagline_location: "Serving Austin, TX",
  logo_text: "Bella Hair Studio",
  year: "2026",
};

/** Mirrors what the raw source templates ship before personalization. */
const RAW = `
  <p>931 Worcester Rd, Framingham Center, MA 01701</p>
  <a href="tel:5080000000">(508) 000-0000</a>
  <a href="tel:9784011428">(978) 401-1428</a>
  <a href="https://instagram.com/amoraleahbeautysalon">@amoraleahbeautysalon</a>
  <a href="mailto:mnandixthandi@gmail.com">Email us</a>
`;

describe("replaceSourceContactDetails", () => {
  const out = replaceSourceContactDetails(RAW, vars);

  it("replaces the source address with the lead's own", () => {
    expect(out).toContain("1200 S Congress Ave");
    expect(out).not.toContain("931 Worcester Rd");
    expect(out).not.toContain("Framingham");
  });

  it("replaces source phone numbers with the lead's number", () => {
    expect(out).toContain("(512) 555-0142");
    expect(out).not.toContain("(508) 000-0000");
    expect(out).not.toContain("(978) 401-1428");
  });

  it("never ships a real source inbox or social handle", () => {
    expect(out).not.toContain("mnandixthandi@gmail.com");
    expect(out).not.toContain("amoraleahbeautysalon");
    expect(out).toContain("hello@bellahairstudio.com");
  });

  it("leaves template text alone when the lead has no value to substitute", () => {
    const noPhone = replaceSourceContactDetails(RAW, {
      ...vars,
      phone_display: "",
    });
    // Better to keep the template's own line than render an empty contact row.
    expect(noPhone).toContain("(508) 000-0000");
  });
});

describe("findContactDetailLeaks", () => {
  it("flags an un-personalized template — the detector must be able to fail", () => {
    const issues = findContactDetailLeaks(RAW, vars);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.join(" ")).toContain("931 Worcester Rd");
    expect(issues.join(" ")).toContain("mnandixthandi@gmail.com");
  });

  it("reports nothing once the page has been personalized", () => {
    expect(findContactDetailLeaks(replaceSourceContactDetails(RAW, vars), vars)).toEqual([]);
  });

  it("does not flag a lead whose own slug contains a source handle", () => {
    const slugCollision = replaceSourceContactDetails(RAW, {
      ...vars,
      business_name: "Acme Mnandi Salon",
    });
    expect(findContactDetailLeaks(slugCollision, vars)).toEqual([]);
  });

  it("ignores markup inside style and script blocks", () => {
    const styled = `<style>.x{content:"931 Worcester Rd"}</style><p>clean</p>`;
    expect(findContactDetailLeaks(styled, vars)).toEqual([]);
  });
});

describe("expandTemplateBrandPhrases", () => {
  it("covers brand prefixes so a partial swap can't leave a hybrid name", () => {
    // "Amora" alone turned "Amora Leah" into "Bella Hair Leah" on live demos.
    expect(expandTemplateBrandPhrases("Amora Leah Salon")).toContain("Amora Leah");
  });

  it("never treats trailing generic copy as the brand", () => {
    const phrases = expandTemplateBrandPhrases("Mnandi Salon & Spa");
    expect(phrases).toContain("Mnandi Salon");
    // A salon page may legitimately say "Salon & Spa" in its own copy.
    expect(phrases).not.toContain("Salon & Spa");
    expect(phrases).not.toContain("& Spa");
  });
});

describe("url-encoded contact details", () => {
  const mapEmbed =
    '<iframe src="https://www.google.com/maps?q=931%20Worcester%20Rd"></iframe>';

  it("rewrites addresses inside map embeds, not just visible text", () => {
    const out = replaceSourceContactDetails(mapEmbed, vars);
    expect(out).not.toContain("931%20Worcester%20Rd");
    expect(out).toContain(encodeURIComponent("1200 S Congress Ave"));
  });

  it("flags an encoded address the visible-text scan would miss", () => {
    const issues = findContactDetailLeaks(mapEmbed, vars);
    expect(issues.join(" ")).toContain("url-encoded");
  });
});
