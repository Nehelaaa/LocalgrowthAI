import type { AdapterUser } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import { findUserByEmail, normalizeEmail } from "@/lib/user-email";

/** Lowercase trim — User.email is looked up with this shape in credentials sign-up too. */
function normEmail(email: string | null | undefined): string {
  return normalizeEmail(email);
}

/**
 * Wraps the default Prisma adapter so OAuth email lookups match stored lowercase emails,
 * and new OAuth users always persist email in lowercase (avoids duplicate-user edge cases).
 */
export function prismaAuthAdapter(prisma: PrismaClient) {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    getUserByEmail(email: string | null | undefined) {
      const e = normEmail(email);
      if (!e) return Promise.resolve(null);
      return findUserByEmail(prisma, e);
    },
    createUser(data: AdapterUser) {
      const email = data.email != null ? normEmail(String(data.email)) : data.email;
      if (!base.createUser) throw new Error("Adapter createUser missing");
      return base.createUser({
        ...data,
        email: email ?? undefined,
      });
    },
    updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const next =
        data.email != null
          ? { ...data, email: normEmail(String(data.email)) }
          : data;
      if (!base.updateUser) throw new Error("Adapter updateUser missing");
      return base.updateUser(next);
    },
  };
}
