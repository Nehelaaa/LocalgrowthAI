"use server";

import { requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { contactStatusListPriority } from "@/lib/contact-status";
import type { ContactStatus, LeadBadge } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export async function getLeads(filters?: {
  search?: string;
  contactStatus?: ContactStatus;
  badge?: LeadBadge;
  minRating?: number;
  minReviews?: number;
  noWebsiteOnly?: boolean;
  businessType?: string;
}) {
  const user = await requireUserForAction();
  const where: Prisma.LeadWhereInput = { userId: user.id };
  const businessAnd: Prisma.BusinessWhereInput[] = [];

  if (filters?.search) {
    const q = filters.search.trim();
    if (q) {
      businessAnd.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
        ],
      });
    }
  }
  if (filters?.contactStatus) {
    where.contactStatus = filters.contactStatus;
  }
  if (filters?.badge) {
    where.badge = filters.badge;
  }
  if (filters?.minRating != null) {
    businessAnd.push({ rating: { gte: filters.minRating } });
  }
  if (filters?.minReviews != null) {
    businessAnd.push({ reviewCount: { gte: filters.minReviews } });
  }
  if (filters?.noWebsiteOnly) {
    businessAnd.push({ OR: [{ website: null }, { hasSocialOnly: true }] });
  }
  if (filters?.businessType) {
    const t = filters.businessType.trim();
    if (t) {
      businessAnd.push({ businessType: { contains: t, mode: "insensitive" } });
    }
  }
  if (businessAnd.length > 0) {
    where.business = { is: { AND: businessAnd } };
  }

  const rows = await prisma.lead.findMany({
    where,
    include: {
      business: true,
    },
    take: 200,
  });

  rows.sort((a, b) => {
    const pa = contactStatusListPriority(a.contactStatus);
    const pb = contactStatusListPriority(b.contactStatus);
    if (pa !== pb) return pa - pb;
    if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return rows;
}

export async function getLeadById(leadId: string) {
  const user = await requireUserForAction();
  return prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
    include: {
      business: true,
    },
  });
}
