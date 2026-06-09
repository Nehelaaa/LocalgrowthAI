"use server";

import { requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { contactStatusListPriority } from "@/lib/contact-status";
import {
  LEADS_DEFAULT_PAGE_SIZE,
  LEADS_FETCH_CAP,
  type LeadsPerPage,
} from "@/lib/leads-query-limits";
import type { Business, ContactStatus, Lead, LeadBadge } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type LeadWithBusiness = Lead & { business: Business };

export type GetLeadsPagedResult = {
  leads: LeadWithBusiness[];
  total: number;
  page: number;
  perPage: LeadsPerPage;
  totalPages: number;
  truncated: boolean;
};

export async function getLeads(
  filters?: {
    search?: string;
    contactStatus?: ContactStatus;
    badge?: LeadBadge;
    minRating?: number;
    minReviews?: number;
    noWebsiteOnly?: boolean;
    businessType?: string;
  },
  pagination?: { page?: number; perPage?: LeadsPerPage },
): Promise<GetLeadsPagedResult> {
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
  } else {
    // Main CRM list: hide archived "not interested" leads unless explicitly filtered.
    where.contactStatus = { not: "CLOSED_LOST" };
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

  const batch = await prisma.lead.findMany({
    where,
    include: {
      business: true,
    },
    take: LEADS_FETCH_CAP + 1,
  });

  const truncated = batch.length > LEADS_FETCH_CAP;
  const rows: LeadWithBusiness[] = truncated ? batch.slice(0, LEADS_FETCH_CAP) : batch;

  rows.sort((a, b) => {
    const pa = contactStatusListPriority(a.contactStatus);
    const pb = contactStatusListPriority(b.contactStatus);
    if (pa !== pb) return pa - pb;
    if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = rows.length;
  const perPage = pagination?.perPage ?? LEADS_DEFAULT_PAGE_SIZE;
  let page = pagination?.page ?? 1;

  if (total === 0) {
    return {
      leads: [],
      total: 0,
      page: 1,
      perPage,
      totalPages: 1,
      truncated,
    };
  }

  if (perPage === "all") {
    return {
      leads: rows,
      total,
      page: 1,
      perPage: "all",
      totalPages: 1,
      truncated,
    };
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  page = Math.min(Math.max(1, page), totalPages);
  const start = (page - 1) * perPage;
  const leads = rows.slice(start, start + perPage);

  return {
    leads,
    total,
    page,
    perPage,
    totalPages,
    truncated,
  };
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
