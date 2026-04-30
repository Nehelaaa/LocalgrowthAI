"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertOwnsLead, requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { canCreateMoreLeads, mustUpgradeForProFeatures } from "@/lib/entitlements";
import { computeLeadScore } from "@/lib/lead-score";
import { generateOpportunityInsights, generateOutreach } from "@/lib/openai";
import type { ContactStatus, Prisma } from "@prisma/client";
import { z } from "zod";

export type ManualCrmLeadResult =
  | { ok: true; leadId: string; isNew: true }
  | { ok: false; code: "LEAD_LIMIT" }
  | { ok: false; code: "INVALID" };

/** Google Places → CRM lead (no thrown errors for expected limits; avoids Next.js dev error overlay). */
export type SaveBusinessAsLeadResult =
  | { ok: true; leadId: string; isNew: boolean }
  | { ok: false; code: "LEAD_LIMIT" | "BUSINESS_TAKEN" };

/**
 * Creates a Business + Lead without Google Places (manual entry from the field).
 * For trades/freelance users who also want prospects in the main CRM pipeline.
 */
export async function saveManualCrmLeadForPipeline(input: {
  businessName: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  businessTypeLabel?: string;
  notesLine?: string;
}): Promise<ManualCrmLeadResult> {
  const name = input.businessName.trim();
  if (name.length < 1) {
    return { ok: false, code: "INVALID" };
  }
  const user = await requireUserForAction();

  const websiteTrim = input.website?.trim() || "";
  const hasUrl = websiteTrim.length > 0;

  const { score, badge } = computeLeadScore({
    rating: null,
    reviewCount: 0,
    noWebsite: !hasUrl,
    hasSocialOnly: false,
  });

  const placeId = `manual-${randomUUID()}`;

  const out = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!canCreateMoreLeads(u.lifetimeLeadsCreated, u)) {
      return { ok: false as const, code: "LEAD_LIMIT" as const };
    }

    const business = await tx.business.create({
      data: {
        placeId,
        name,
        address: input.address,
        city: input.city,
        state: input.state,
        phone: input.phone,
        website: hasUrl ? websiteTrim : null,
        rating: null,
        reviewCount: 0,
        googleMapsUrl: null,
        businessType: input.businessTypeLabel ?? "Manual / field",
        hasSocialOnly: false,
      },
    });

    const lead = await tx.lead.create({
      data: {
        userId: u.id,
        businessId: business.id,
        leadScore: score,
        badge,
        notes: input.notesLine,
      },
    });

    await tx.user.update({
      where: { id: u.id },
      data: { lifetimeLeadsCreated: { increment: 1 } },
    });

    return { ok: true as const, leadId: lead.id, isNew: true as const };
  });

  if (!out.ok) {
    return { ok: false, code: "LEAD_LIMIT" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return { ok: true, leadId: out.leadId, isNew: true };
}

export type ManualLeadFormState = { error?: string; success?: boolean };

/** Form action: add a CRM lead without Google search (any profession). */
export async function addManualCrmLeadForm(
  _prev: ManualLeadFormState,
  formData: FormData
): Promise<ManualLeadFormState> {
  await requireUserForAction();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const r = await saveManualCrmLeadForPipeline({
    businessName,
    phone,
    businessTypeLabel: "Manual entry",
    notesLine: notes,
  });
  if (r.ok) {
    return { success: true };
  }
  if (r.code === "LEAD_LIMIT") {
    return {
      error:
        "You've used all Free-plan lead slots (lifetime total). Upgrade to Pro for unlimited leads.",
    };
  }
  return { error: "Enter a business or contact name for this lead." };
}

export async function saveBusinessAsLead(place: {
  placeId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  googleMapsUrl: string;
  businessType?: string;
  lat?: number;
  lng?: number;
  hasSocialOnly: boolean;
  noWebsite: boolean;
  photoUrl?: string;
}): Promise<SaveBusinessAsLeadResult> {
  const user = await requireUserForAction();

  const existing = await prisma.business.findUnique({
    where: { placeId: place.placeId },
    include: { lead: true },
  });
  if (existing?.lead) {
    if (existing.lead.userId && existing.lead.userId !== user.id) {
      return { ok: false, code: "BUSINESS_TAKEN" };
    }
    if (!existing.lead.userId) {
      await prisma.lead.update({
        where: { id: existing.lead.id },
        data: { userId: user.id },
      });
    }
    return { ok: true, leadId: existing.lead.id, isNew: false };
  }

  const { score, badge } = computeLeadScore({
    rating: place.rating,
    reviewCount: place.reviewCount,
    noWebsite: place.noWebsite,
    hasSocialOnly: place.hasSocialOnly,
  });

  const result = await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!canCreateMoreLeads(u.lifetimeLeadsCreated, u)) {
      return { ok: false as const, code: "LEAD_LIMIT" as const };
    }

    const business = await tx.business.upsert({
      where: { placeId: place.placeId },
      create: {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        city: place.city,
        state: place.state,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
        reviewCount: place.reviewCount,
        googleMapsUrl: place.googleMapsUrl,
        businessType: place.businessType,
        lat: place.lat,
        lng: place.lng,
        hasSocialOnly: place.hasSocialOnly,
        photoUrl: place.photoUrl,
      },
      update: {
        name: place.name,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        website: place.website,
        hasSocialOnly: place.hasSocialOnly,
        photoUrl: place.photoUrl,
      },
    });

    const lead = await tx.lead.create({
      data: {
        userId: u.id,
        businessId: business.id,
        leadScore: score,
        badge,
      },
    });

    await tx.user.update({
      where: { id: u.id },
      data: { lifetimeLeadsCreated: { increment: 1 } },
    });

    return { ok: true as const, leadId: lead.id };
  });

  if (!result.ok) {
    return { ok: false, code: "LEAD_LIMIT" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return { ok: true, leadId: result.leadId, isNew: true };
}

const updateLeadSchema = z.object({
  leadId: z.string(),
  contactStatus: z.enum([
    "NOT_CONTACTED",
    "CONTACTED",
    "INTERESTED",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]).optional(),
  notes: z.string().optional(),
  // HTML date inputs use YYYY-MM-DD; the client may also send full ISO datetimes
  followUpDate: z
    .union([z.iso.date(), z.iso.datetime()])
    .nullable()
    .optional(),
  tags: z.array(z.string()).optional(),
  // Accept string; numbers can come from atypical client payloads
  websiteQuote: z.union([z.string(), z.number()]).optional(),
});

function tagsToDb(tags: string[] | undefined): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  return JSON.stringify(tags);
}

export async function updateLead(formData: z.infer<typeof updateLeadSchema>) {
  const user = await requireUserForAction();
  const parsed = updateLeadSchema.parse(formData);
  await assertOwnsLead(user.id, parsed.leadId);
  const { leadId, contactStatus, notes, followUpDate, tags, websiteQuote } =
    parsed;

  const data: Prisma.LeadUpdateInput = {};

  if (contactStatus !== undefined) {
    data.contactStatus = contactStatus;
  }
  if (notes !== undefined) {
    data.notes = notes || null;
  }
  if (tags !== undefined) {
    const encoded = tagsToDb(tags);
    if (encoded !== undefined) {
      data.tags = encoded;
    }
  }
  if (followUpDate !== undefined) {
    if (followUpDate === null) {
      data.followUpDate = null;
    } else {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(followUpDate)
        ? new Date(`${followUpDate}T00:00:00.000Z`)
        : new Date(followUpDate);
      if (Number.isNaN(d.getTime())) {
        data.followUpDate = null;
      } else {
        data.followUpDate = d;
      }
    }
  }
  if (websiteQuote !== undefined) {
    const t = String(websiteQuote).trim();
    data.websiteQuote = t === "" ? null : t;
  }

  if (Object.keys(data).length === 0) {
    return;
  }

  await prisma.lead.update({
    where: { id: leadId, userId: user.id },
    data,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

export async function generateOpportunityForLead(leadId: string) {
  const user = await requireUserForAction();
  if (mustUpgradeForProFeatures(user)) {
    throw new Error("PRO_REQUIRED");
  }
  await prisma.aiDayUsage.upsert({
    where: {
      userId_day: { userId: user.id, day: new Date().toISOString().slice(0, 10) },
    },
    create: { userId: user.id, day: new Date().toISOString().slice(0, 10), count: 1 },
    update: { count: { increment: 1 } },
  });
  await assertOwnsLead(user.id, leadId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { business: true },
  });
  if (!lead) throw new Error("Lead not found");

  const { insights, revenueEstimate } = await generateOpportunityInsights({
    businessName: lead.business.name,
    businessType: lead.business.businessType ?? "local business",
    city: lead.business.city ?? undefined,
    state: lead.business.state ?? undefined,
    rating: lead.business.rating ?? undefined,
    reviewCount: lead.business.reviewCount,
    hasNoWebsite: lead.business.website == null || lead.business.hasSocialOnly,
    hasSocialOnly: lead.business.hasSocialOnly,
  });

  const noKeyMessage = "Add OPENAI_API_KEY to your .env file";
  if (!insights.startsWith(noKeyMessage)) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { opportunityInsights: insights, revenueEstimate },
    });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return { insights, revenueEstimate };
}

export async function generateOutreachForLead(
  leadId: string,
  type: "email" | "call_script" | "instagram_dm" | "loom_script"
) {
  const user = await requireUserForAction();
  if (mustUpgradeForProFeatures(user)) {
    throw new Error("PRO_REQUIRED");
  }
  await prisma.aiDayUsage.upsert({
    where: {
      userId_day: { userId: user.id, day: new Date().toISOString().slice(0, 10) },
    },
    create: { userId: user.id, day: new Date().toISOString().slice(0, 10), count: 1 },
    update: { count: { increment: 1 } },
  });
  await assertOwnsLead(user.id, leadId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { business: true },
  });
  if (!lead) throw new Error("Lead not found");

  const content = await generateOutreach({
    businessName: lead.business.name,
    businessType: lead.business.businessType ?? "local business",
    city: lead.business.city ?? undefined,
    state: lead.business.state ?? undefined,
    rating: lead.business.rating ?? undefined,
    reviewCount: lead.business.reviewCount,
    type,
  });

  const noKeyMessage = "Add OPENAI_API_KEY to your .env file";
  if (!content.startsWith(noKeyMessage)) {
    await prisma.outreach.create({
      data: { leadId, type, content },
    });
  }
  revalidatePath("/dashboard/leads");
  return { content, type };
}

export async function getOutreaches(leadId: string) {
  const user = await requireUserForAction();
  await assertOwnsLead(user.id, leadId);
  return prisma.outreach.findMany({
    where: { leadId },
    orderBy: { generatedAt: "desc" },
  });
}

export async function updateLeadStatus(
  leadId: string,
  contactStatus: ContactStatus
) {
  const user = await requireUserForAction();
  await prisma.lead.update({
    where: { id: leadId, userId: user.id },
    data: { contactStatus },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

/** Deletes the lead (and cascaded outreach / demos), then the linked business. */
export async function deleteLead(leadId: string) {
  const user = await requireUserForAction();
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
    select: { id: true, businessId: true },
  });
  if (!lead) throw new Error("Lead not found");

  await prisma.$transaction(async (tx) => {
    await tx.lead.delete({ where: { id: lead.id } });
    await tx.business.delete({ where: { id: lead.businessId } });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}
