"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserForAction } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

const professionIds = Object.keys(PROFESSIONS) as [ProfessionId, ...ProfessionId[]];
const professionSchema = z.enum(professionIds);

export type OnboardingState = { error?: string; success?: boolean };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await requireUserForAction();
  const prof = String(formData.get("profession") ?? "");
  const parsed = professionSchema.safeParse(prof);
  if (!parsed.success) {
    return { error: "Choose your profession to continue." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingComplete: true, profession: parsed.data },
  });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true };
}
