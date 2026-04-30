"use server";

import { revalidatePath } from "next/cache";
import { assertOwnsLead, requireUserForAction } from "@/lib/session-user";
import { mustUpgradeForProFeatures } from "@/lib/entitlements";
import { prisma } from "@/lib/db";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const DEMO_TEMPLATE = (name: string, niche: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(name)} | Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900">
  <!-- Hero -->
  <header class="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">${escapeHtml(name)}</h1>
      <p class="text-xl text-indigo-100">Your trusted ${escapeHtml(niche)} in the community</p>
      <a href="#contact" class="inline-block mt-8 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition">Get in Touch</a>
    </div>
  </header>

  <!-- Services -->
  <section class="py-16 px-6 max-w-4xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-12">Our Services</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg mb-4"></div>
        <h3 class="font-semibold text-lg mb-2">Quality ${escapeHtml(niche)}</h3>
        <p class="text-slate-600">Professional service you can rely on.</p>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg mb-4"></div>
        <h3 class="font-semibold text-lg mb-2">Local Expertise</h3>
        <p class="text-slate-600">Serving our community with care.</p>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg mb-4"></div>
        <h3 class="font-semibold text-lg mb-2">Customer First</h3>
        <p class="text-slate-600">Your satisfaction is our priority.</p>
      </div>
    </div>
  </section>

  <!-- Contact CTA -->
  <section id="contact" class="py-16 px-6 bg-slate-100">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
      <p class="text-slate-600 mb-8">Reach out today for a quote or to schedule a visit.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="tel:" class="bg-indigo-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-indigo-700 transition">Call Now</a>
        <a href="mailto:" class="border-2 border-indigo-600 text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition">Email Us</a>
      </div>
    </div>
  </section>

  <footer class="py-8 text-center text-slate-500 text-sm">
    © ${new Date().getFullYear()} ${escapeHtml(name)}. All rights reserved.
  </footer>
</body>
</html>
`;

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

  const slug = `${lead.business.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const niche = lead.business.businessType ?? "business";
  const html = DEMO_TEMPLATE(lead.business.name, niche);

  const demo = await prisma.demoPage.create({
    data: {
      leadId,
      slug,
      htmlContent: html,
    },
  });

  revalidatePath("/dashboard/leads");
  return { slug: demo.slug, id: demo.id };
}

export async function getDemoPage(slug: string) {
  return prisma.demoPage.findUnique({
    where: { slug },
    include: { lead: { include: { business: true } } },
  });
}
