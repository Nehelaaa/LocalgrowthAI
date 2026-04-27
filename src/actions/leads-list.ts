"use server";

import { requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
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
  const businessWhere: Prisma.BusinessWhereInput = {};

  if (filters?.search) {
    businessWhere.name = { contains: filters.search };
  }
  if (filters?.contactStatus) {
    where.contactStatus = filters.contactStatus;
  }
  if (filters?.badge) {
    where.badge = filters.badge;
  }
  if (filters?.minRating != null) {
    businessWhere.rating = { gte: filters.minRating };
  }
  if (filters?.minReviews != null) {
    businessWhere.reviewCount = { gte: filters.minReviews };
  }
  if (filters?.noWebsiteOnly) {
    businessWhere.OR = [{ website: null }, { hasSocialOnly: true }];
  }
  if (filters?.businessType) {
    businessWhere.businessType = { contains: filters.businessType };
  }
  if (Object.keys(businessWhere).length > 0) {
    where.business = { is: businessWhere };
  }

  return prisma.lead.findMany({
    where,
    include: {
      business: true,
    },
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function getLeadById(leadId: string) {
  const user = await requireUserForAction();
  return prisma.lead.findFirst({
    where: { id: leadId, userId: user.id },
    include: {
      business: true,
      outreachs: true,
      demoPages: true,
    },
  });
}
