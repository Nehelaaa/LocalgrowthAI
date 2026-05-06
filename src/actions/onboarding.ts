"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  botRejectedUserMessage,
  isBotHoneypotTripped,
} from "@/lib/form-bot-guard";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";
import { requireUserForAction } from "@/lib/session-user";

const professionIds = Object.keys(PROFESSIONS) as [ProfessionId, ...ProfessionId[]];
const professionSchema = z.union([z.enum(professionIds), z.literal("")]);

export type OnboardingState = { error?: string; success?: boolean };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  if (isBotHoneypotTripped(formData)) {
    return { error: botRejectedUserMessage() };
  }
  const user = await requireUserForAction();
  const prof = String(formData.get("profession") ?? "");
  const parsed = professionSchema.safeParse(prof);
  if (!parsed.success) {
    return { error: "Choose a profession or skip." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingComplete: true, profession: parsed.data ? parsed.data : null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true };
}
