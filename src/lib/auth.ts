import "@/lib/clear-auth-url-in-dev";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { prismaAuthAdapter } from "@/lib/prisma-auth-adapter";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: Role;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    id?: string;
  }
}

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasGoogle = Boolean(googleId && googleSecret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAuthAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  /** Send OAuth/provider failures back to the app instead of a generic auth error page. */
  pages: { signIn: "/login", error: "/login" },
  debug: process.env.NODE_ENV === "development",
  providers: [
    ...(hasGoogle
      ? [
          Google({
            clientId: googleId!,
            clientSecret: googleSecret!,
            // Same email as an existing (e.g. credentials) user: link OAuth to that user when Google’s email is trusted.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || credentials.password == null) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        if (password.length < 1) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });
      // When linking Google to an existing email/password user, skip — Auth.js also fires this event for that path.
      if (row?.passwordHash) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "USER",
          // New OAuth signups complete profession in onboarding (same as email signups).
          onboardingComplete: false,
        },
      });
    },
    async linkAccount() {
      // Do not change onboarding or profession when linking Google to an existing account.
    },
  },
});
