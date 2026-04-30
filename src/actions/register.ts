"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

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

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
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
