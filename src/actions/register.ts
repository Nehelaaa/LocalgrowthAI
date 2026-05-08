"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  botRejectedUserMessage,
  isBotHoneypotTripped,
} from "@/lib/form-bot-guard";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";
import { rateLimitAuthForm } from "@/lib/rate-limit-auth-forms";
import { getClientIp } from "@/lib/request-ip";
import { findUserByEmail } from "@/lib/user-email";

const professionIds = Object.keys(PROFESSIONS) as [ProfessionId, ...ProfessionId[]];

const schema = z
  .object({
    name: z.string().min(1, "Name required").max(120),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(200),
    profession: z.union([z.enum(professionIds), z.literal("")]).optional(),
  })
  .strict();

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  if (isBotHoneypotTripped(formData)) {
    return { error: botRejectedUserMessage() };
  }
  const ip = await getClientIp();
  if (!rateLimitAuthForm(`register:${ip}`).success) {
    return {
      error: "Too many sign-up attempts from this network. Please wait a few minutes and try again.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .toLowerCase()
      .trim(),
    password: String(formData.get("password") ?? ""),
    profession: String(formData.get("profession") ?? ""),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      const f = e.path[0] as string;
      if (f) fe[f] = e.message;
    }
    return { fieldErrors: fe, error: "Check the fields above." };
  }

  const existing = await findUserByEmail(prisma, parsed.data.email);
  if (existing) {
    return { error: "An account with that email already exists. Try signing in." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      plan: "free",
      grandfatheredPro: false,
      onboardingComplete: false,
      profession: parsed.data.profession && parsed.data.profession.length > 0 ? parsed.data.profession : null,
    },
  });

  // Claim saved leads with no owner (e.g. before first user existed).
  await prisma.$executeRaw(
    Prisma.sql`UPDATE "Lead" SET "userId" = ${user.id} WHERE "userId" IS NULL`
  );

  return { success: true };
}
