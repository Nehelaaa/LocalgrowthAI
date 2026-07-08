"use server";

import { revalidatePath } from "next/cache";
import { buildDemoWebsiteHtml } from "@/lib/build-demo-website";
import {
  pickTemplateId,
  listPortfolioTemplates,
  describeTemplatePick,
} from "@/lib/demo-templates/render-portfolio-template";
import { stampTemplateMarker } from "@/lib/demo-templates/render-demo-page";
import { assertOwnsLead, requireUserForAction } from "@/lib/session-user";
import { mustUpgradeForProFeatures } from "@/lib/entitlements";
import { googleMapsListingUrl } from "@/lib/google-maps-links";
import { prisma } from "@/lib/db";

export async function generateDemoPage(leadId: string) {
  const user = await requireUserForAction();
  if (mustUpgradeForProFeatures(user)) {
    throw new Error("PRO_REQUIRED");
  }
  await assertOwnsLead(user.id, leadId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { business: true },
  });
  if (!lead) throw new Error("Lead not found");

  const biz = lead.business;
  const slug = `${biz.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}-${crypto.randomUUID().slice(0, 8)}`;

  const input = {
    name: biz.name,
    businessType: biz.businessType,
    phone: biz.phone,
    address: biz.address,
    city: biz.city,
    state: biz.state,
    rating: biz.rating,
    reviewCount: biz.reviewCount,
    photoUrl: biz.photoUrl,
    googleMapsUrl:
      biz.googleMapsUrl ??
      googleMapsListingUrl(biz.placeId, biz.name),
  };

  const templateId = pickTemplateId(input);
  const html = await buildDemoWebsiteHtml(input, templateId);
  const stampedHtml = templateId ? stampTemplateMarker(html, templateId) : html;

  const demo = await prisma.demoPage.create({
    data: {
      leadId,
      slug,
      htmlContent: stampedHtml,
    },
  });

  revalidatePath("/dashboard/leads");
  const pick = describeTemplatePick(input);
  const templateName =
    listPortfolioTemplates().find((t) => t.id === templateId)?.name ?? null;
  return {
    slug: demo.slug,
    id: demo.id,
    templateId,
    templateName,
    nicheCategory: pick.nicheCategory,
    nicheLabel: pick.nicheLabel,
  };
}

export async function getDemoPage(slug: string) {
  return prisma.demoPage.findUnique({
    where: { slug },
    include: { lead: { include: { business: true } } },
  });
}

export async function getLatestDemoForLead(leadId: string) {
  const user = await requireUserForAction();
  await assertOwnsLead(user.id, leadId);
  return prisma.demoPage.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    select: { slug: true, createdAt: true },
  });
}
