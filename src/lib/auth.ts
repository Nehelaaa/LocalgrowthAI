import "@/lib/normalize-env-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { prismaAuthAdapter } from "@/lib/prisma-auth-adapter";
import { isOwnerEmail } from "@/lib/owner-emails";
import { findUserByEmail, normalizeEmail } from "@/lib/user-email";
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

/** Explicit secret avoids rare cases where inferred env isn’t seen at runtime on the server (shows as ?error=Configuration). */
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

function ownerBootstrapPassword(): string {
  return process.env.OWNER_BOOTSTRAP_PASSWORD?.trim() ?? "";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  adapter: prismaAuthAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
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
        const email = normalizeEmail(String(credentials.email));
        const password = String(credentials.password);
        if (password.length < 1) return null;
        const user = await findUserByEmail(prisma, email);
        if (!user?.passwordHash) {
          const bootstrapPassword = ownerBootstrapPassword();
          if (
            !isOwnerEmail(email) ||
            bootstrapPassword.length < 8 ||
            password !== bootstrapPassword
          ) {
            return null;
          }

          const passwordHash = await hash(password, 12);
          const owner = user
            ? await prisma.user.update({
                where: { id: user.id },
                data: {
                  passwordHash,
                  role: "ADMIN",
                  disabled: false,
                  onboardingComplete: true,
                },
              })
            : await prisma.user.create({
                data: {
                  email,
                  passwordHash,
                  role: "ADMIN",
                  plan: "free",
                  onboardingComplete: true,
                },
              });

          return {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            image: owner.image,
            role: owner.role,
          };
        }
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
    async signIn({ user, account, profile }) {
      // If a user already exists with this email (e.g. credentials signup) and the same Google
      // account tries to sign in, Auth.js may throw OAuthAccountNotLinked depending on prior state.
      // We explicitly link (or re-link) the Google account to the email-matching user since this
      // app already opts into dangerous email linking.
      if (account?.provider === "google") {
        const email =
          typeof (profile as { email?: unknown } | null)?.email === "string"
            ? normalizeEmail(String((profile as { email?: unknown }).email))
            : typeof user?.email === "string"
              ? normalizeEmail(String(user.email))
              : "";
        const providerAccountId = String(account.providerAccountId ?? "").trim();
        if (email && providerAccountId) {
          const existing = await findUserByEmail(prisma, email);
          if (existing) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId,
                },
              },
              create: {
                userId: existing.id,
                type: account.type ?? "oidc",
                provider: "google",
                providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state:
                  typeof account.session_state === "string"
                    ? account.session_state
                    : account.session_state == null
                      ? null
                      : String(account.session_state),
              },
              update: {
                userId: existing.id,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state:
                  typeof account.session_state === "string"
                    ? account.session_state
                    : account.session_state == null
                      ? null
                      : String(account.session_state),
              },
            });
          }
        }
      }
      return true;
    },
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
