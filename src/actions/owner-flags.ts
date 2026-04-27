"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

export async function ownerListFeatureFlags() {
  await requireOwnerOrRedirect();
  return prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
    include: { overrides: { include: { user: { select: { id: true, email: true, name: true } } } } },
  });
}

export async function ownerUpsertFeatureFlag(input: {
  key: string;
  label: string;
  freeEnabled: boolean;
  proEnabled: boolean;
}) {
  await requireOwnerOrRedirect();
  const s = z
    .object({
      key: z.string().min(2).max(80),
      label: z.string().min(2).max(120),
      freeEnabled: z.boolean(),
      proEnabled: z.boolean(),
    })
    .parse(input);

  await prisma.featureFlag.upsert({
    where: { key: s.key },
    create: s,
    update: { label: s.label, freeEnabled: s.freeEnabled, proEnabled: s.proEnabled },
  });
  revalidatePath("/owner/flags");
}

export async function ownerSetFeatureOverride(input: {
  featureId: string;
  userId: string;
  enabled: boolean;
}) {
  await requireOwnerOrRedirect();
  const s = z
    .object({
      featureId: z.string().min(1),
      userId: z.string().min(1),
      enabled: z.boolean(),
    })
    .parse(input);

  await prisma.featureFlagOverride.upsert({
    where: { featureId_userId: { featureId: s.featureId, userId: s.userId } },
    create: { featureId: s.featureId, userId: s.userId, enabled: s.enabled },
    update: { enabled: s.enabled },
  });
  revalidatePath("/owner/flags");
  revalidatePath(`/owner/users/${s.userId}`);
}

