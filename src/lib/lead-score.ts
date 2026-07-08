import type { LeadBadge } from "@prisma/client";

export interface ScoreInput {
  rating?: number | null;
  reviewCount: number;
  noWebsite: boolean;
  hasSocialOnly: boolean;
  hasRecentPhotos?: boolean;
}

export function computeLeadScore(input: ScoreInput): { score: number; badge: LeadBadge } {
  let score = 0;

  if (input.rating != null && input.rating >= 4) {
    score += 25;
  } else if (input.rating != null && input.rating >= 3) {
    score += 10;
  }

  if (input.reviewCount >= 50) score += 20;
  else if (input.reviewCount >= 20) score += 15;
  else if (input.reviewCount >= 5) score += 10;

  if (input.noWebsite) {
    score += 35;
  } else if (input.hasSocialOnly) {
    score += 20;
  }

  if (input.hasRecentPhotos) score += 10;

  const clamped = Math.min(100, Math.max(0, score));

  let badge: LeadBadge = "COLD";
  if (clamped >= 70) badge = "HOT";
  else if (clamped >= 40) badge = "WARM";

  return { score: clamped, badge };
}

/** Human-readable score breakdown for tooltips. */
export function explainLeadScore(input: ScoreInput): string[] {
  const lines: string[] = [];

  if (input.rating != null && input.rating >= 4) {
    lines.push(`Strong rating (${input.rating}★)`);
  } else if (input.rating != null && input.rating >= 3) {
    lines.push(`Decent rating (${input.rating}★)`);
  } else if (input.rating != null) {
    lines.push(`Lower rating (${input.rating}★)`);
  }

  if (input.reviewCount >= 50) {
    lines.push(`${input.reviewCount} reviews — high visibility`);
  } else if (input.reviewCount >= 20) {
    lines.push(`${input.reviewCount} reviews`);
  } else if (input.reviewCount >= 5) {
    lines.push(`${input.reviewCount} reviews`);
  } else if (input.reviewCount > 0) {
    lines.push(`${input.reviewCount} review${input.reviewCount === 1 ? "" : "s"}`);
  }

  if (input.noWebsite) {
    lines.push("No website — top opportunity");
  } else if (input.hasSocialOnly) {
    lines.push("Social-only web presence");
  } else {
    lines.push("Has a website");
  }

  if (input.hasRecentPhotos) {
    lines.push("Recent photos on listing");
  }

  return lines;
}
