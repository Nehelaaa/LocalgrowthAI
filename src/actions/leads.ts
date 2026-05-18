"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertOwnsLead, requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { canCreateMoreLeads } from "@/lib/entitlements";
import { computeLeadScore } from "@/lib/lead-score";
import { googleMapsListingUrl } from "@/lib/google-maps-links";
import {
  leadInvoiceDraftV1Schema,
  type LeadInvoiceDraftV1,
} from "@/lib/lead-invoice-draft";
import type { ContactStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export type ManualCrmLeadResult =
  | { ok: true; leadId: string; isNew: true }
  | { ok: false; code: "LEAD_LIMIT" }
  | { ok: false; code: "INVALID" };

/** Google Places → CRM lead (no thrown errors for expected limits; avoids Next.js dev error overlay). */
export type SaveBusinessAsLeadResult =
  | { ok: true; leadId: string; isNew: boolean }
  | { ok: false; code: "LEAD_LIMIT" };

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

  const existingBusiness = await prisma.business.findUnique({
    where: { placeId: place.placeId },
    include: {
      leads: { where: { userId: user.id }, take: 1 },
    },
  });
  const myExistingLead = existingBusiness?.leads[0];
  if (myExistingLead) {
    return { ok: true, leadId: myExistingLead.id, isNew: false };
  }

  // Orphan lead (no user) on this business — claim it for the current account.
  if (existingBusiness) {
    const orphan = await prisma.lead.findFirst({
      where: { businessId: existingBusiness.id, userId: null },
    });
    if (orphan) {
      await prisma.lead.update({
        where: { id: orphan.id },
        data: { userId: user.id },
      });
      return { ok: true, leadId: orphan.id, isNew: false };
    }
  }

  const { score, badge } = computeLeadScore({
    rating: place.rating,
    reviewCount: place.reviewCount,
    noWebsite: place.noWebsite,
    hasSocialOnly: place.hasSocialOnly,
  });

  const canonicalMapsUrl = googleMapsListingUrl(
    place.placeId,
    [place.name, place.address].filter(Boolean).join(" · ") || place.name
  );

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
        googleMapsUrl: canonicalMapsUrl,
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
        googleMapsUrl: canonicalMapsUrl,
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
  /** YYYY-MM-DD from `<input type="date" />`, ISO string, or null to clear */
  followUpDate: z.union([z.string(), z.null()]).optional(),
  tags: z.array(z.string()).optional(),
  // Accept string; numbers can come from atypical client payloads
  websiteQuote: z.union([z.string(), z.number()]).optional(),
  pocName: z.string().optional(),
  pocPhone: z.string().optional(),
  pocEmail: z.string().optional(),
});

function tagsToDb(tags: string[] | undefined): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  return JSON.stringify(tags);
}

function parseFollowUpForDb(value: string | null): Date | null {
  if (value === null) return null;
  const raw = String(value).trim();
  if (raw === "") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateLead(formData: z.infer<typeof updateLeadSchema>) {
  let user;
  try {
    user = await requireUserForAction();
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      throw new Error("Your session expired. Please sign in again.");
    }
    if (e instanceof Error && e.message === "ACCOUNT_DISABLED") {
      throw new Error("This account is disabled.");
    }
    throw e;
  }

  const parsed = updateLeadSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(", ") || "Invalid lead update."
    );
  }

  try {
    await assertOwnsLead(user.id, parsed.data.leadId);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      throw new Error("You can’t update this lead.");
    }
    throw e;
  }
  const {
    leadId,
    contactStatus,
    notes,
    followUpDate,
    tags,
    websiteQuote,
    pocName,
    pocPhone,
    pocEmail,
  } = parsed.data;

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
    data.followUpDate = parseFollowUpForDb(followUpDate);
  }
  if (websiteQuote !== undefined) {
    const t = String(websiteQuote).trim();
    data.websiteQuote = t === "" ? null : t;
  }
  if (pocName !== undefined) {
    data.pocName = String(pocName).trim() || null;
  }
  if (pocPhone !== undefined) {
    data.pocPhone = String(pocPhone).trim() || null;
  }
  if (pocEmail !== undefined) {
    data.pocEmail = String(pocEmail).trim() || null;
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

export async function saveLeadInvoiceDraft(
  leadId: string,
  draft: LeadInvoiceDraftV1
) {
  const user = await requireUserForAction();
  const parsed = leadInvoiceDraftV1Schema.safeParse(draft);
  if (!parsed.success) {
    throw new Error("Invalid invoice draft.");
  }
  try {
    await assertOwnsLead(user.id, leadId);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      throw new Error("You can’t update this lead.");
    }
    throw e;
  }
  await prisma.lead.update({
    where: { id: leadId, userId: user.id },
    data: { invoiceDraft: parsed.data },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

export async function clearLeadInvoiceDraft(leadId: string) {
  const user = await requireUserForAction();
  try {
    await assertOwnsLead(user.id, leadId);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      throw new Error("You can’t update this lead.");
    }
    throw e;
  }
  await prisma.lead.update({
    where: { id: leadId, userId: user.id },
    data: { invoiceDraft: Prisma.DbNull },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
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
    const remaining = await tx.lead.count({
      where: { businessId: lead.businessId },
    });
    if (remaining === 0) {
      await tx.business.delete({ where: { id: lead.businessId } });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}
