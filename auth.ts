import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";
import { loginSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const DUMMY_HASH = "$2b$12$gApJSLGgQWlzM1UoFF9IfesQ7xau6PBnS5t8NixI3R0IKi91hycZK";
const demoAccountByRole: Record<Role, string> = {
  EMPLOYEE: "employee@helpdesklite.local",
  SUPPORT: "support@helpdesklite.local",
  MANAGER: "manager@helpdesklite.local",
};

async function recordFailure(email: string) {
  const now = new Date();
  const existing = await prisma.authAttempt.findUnique({ where: { email } });
  const isNewWindow = !existing || now.getTime() - existing.windowStarted.getTime() > WINDOW_MS;
  const failures = isNewWindow ? 1 : existing.failures + 1;
  const blockedUntil = failures >= MAX_FAILURES ? new Date(now.getTime() + WINDOW_MS) : null;

  await prisma.authAttempt.upsert({
    where: { email },
    create: { email, failures, windowStarted: now, blockedUntil },
    update: {
      failures,
      windowStarted: isNewWindow ? now : existing?.windowStarted,
      blockedUntil,
    },
  });
}

export const { handlers, auth, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Work email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email;
        const attempt = await prisma.authAttempt.findUnique({ where: { email } });
        if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const passwordMatches = await compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !passwordMatches || !user.active) {
          await recordFailure(email);
          return null;
        }

        await prisma.authAttempt.deleteMany({ where: { email } });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        };
      },
    }),
    Credentials({
      id: "demo",
      name: "Live Demo",
      credentials: {
        role: { label: "Demo role", type: "text" },
      },
      authorize: async (raw) => {
        if (process.env.ENABLE_PUBLIC_DEMO !== "true") return null;

        const parsedRole = z.nativeEnum(Role).safeParse(raw?.role);
        if (!parsedRole.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: demoAccountByRole[parsedRole.data] },
        });
        if (!user?.active) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          demo: true,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.active = user.active;
        token.demo = user.demo === true;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id);
      session.user.role = token.role as typeof session.user.role;
      session.user.active = token.active === true;
      session.user.demo = token.demo === true;
      return session;
    },
  },
});
