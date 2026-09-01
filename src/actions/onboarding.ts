"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BUSINESS_TYPE_MAX_LENGTH } from "@/lib/business-types";
import { prisma } from "@/lib/db";
import {
  botRejectedUserMessage,
  isBotHoneypotTripped,
} from "@/lib/form-bot-guard";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";
import { requireUserForAction } from "@/lib/session-user";
import { isUsStateCode } from "@/lib/us-states";

const professionIds = Object.keys(PROFESSIONS) as [ProfessionId, ...ProfessionId[]];
const professionSchema = z.union([z.enum(professionIds), z.literal("")]);

export type OnboardingState = { error?: string; success?: boolean };

/** Trim, collapse whitespace, and treat blank as "not answered". */
function optionalText(value: FormDataEntryValue | null, max: number): string | null {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return null;
  return raw.slice(0, max);
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  if (isBotHoneypotTripped(formData)) {
    return { error: botRejectedUserMessage() };
  }
  const user = await requireUserForAction();

  const parsed = professionSchema.safeParse(String(formData.get("profession") ?? ""));
  if (!parsed.success) {
    return { error: "Choose what you do, or skip this step." };
  }

  const targetCity = optionalText(formData.get("targetCity"), 80);
  const targetBusinessType = optionalText(
    formData.get("targetBusinessType"),
    BUSINESS_TYPE_MAX_LENGTH
  );
  const rawState = optionalText(formData.get("targetState"), 2);
  const targetState = rawState ? rawState.toUpperCase() : null;

  // A city without a valid state can't prefill a search, so reject rather than store junk.
  if (targetState && !isUsStateCode(targetState)) {
    return { error: "Pick a state from the list, or clear the city to skip." };
  }
  if (targetCity && !targetState) {
    return { error: "Add the state for that city, or clear it to skip." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingComplete: true,
      profession: parsed.data ? parsed.data : null,
      targetCity,
      targetState,
      targetBusinessType,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/search");
  revalidatePath("/onboarding");
  return { success: true };
}
