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
