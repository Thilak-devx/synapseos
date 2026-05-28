import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { loginSchema } from "@/lib/auth-schemas";
import { ensureSeededDemoAccounts } from "@/lib/demo-accounts";
import { env, isGitHubConfigured, isProductionDatabaseConfigured } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getPermissionsForRole } from "@/lib/rbac";
import { getRequestIp } from "@/lib/request";
import { getUserByEmail, getUserPermissionsById, getUserRoleById, mapRolePermissions } from "@/services/auth.service";
import { createFailedLoginAuditEvent, createLoginAuditEvent } from "@/services/dbms.service";
import type { UserRole } from "@/types";

const AUTH_WINDOW_MS = 10 * 60 * 1000;
const AUTH_LOCK_MS = 5 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 5;
const failedLoginAttempts = new Map<
  string,
  { count: number; firstAttemptAt: number; lockedUntil?: number }
>();

function getAuthAttemptState(email: string) {
  const key = email.trim().toLowerCase();
  const current = failedLoginAttempts.get(key);
  const now = Date.now();

  if (!current) {
    return { key, state: null };
  }

  if (current.lockedUntil && current.lockedUntil <= now) {
    failedLoginAttempts.delete(key);
    return { key, state: null };
  }

  if (now - current.firstAttemptAt > AUTH_WINDOW_MS) {
    failedLoginAttempts.delete(key);
    return { key, state: null };
  }

  return { key, state: current };
}

function registerFailedAttempt(email: string) {
  const { key, state } = getAuthAttemptState(email);
  const now = Date.now();

  if (!state) {
    failedLoginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
    });
    return;
  }

  const nextCount = state.count + 1;
  failedLoginAttempts.set(key, {
    ...state,
    count: nextCount,
    lockedUntil: nextCount >= AUTH_MAX_ATTEMPTS ? now + AUTH_LOCK_MS : undefined,
  });
}

function clearFailedAttempts(email: string) {
  failedLoginAttempts.delete(email.trim().toLowerCase());
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: {
        label: "Work email",
        type: "email",
      },
      password: {
        label: "Password",
        type: "password",
      },
      role: {
        label: "Selected role",
        type: "text",
      },
    },
    async authorize(credentials, req) {
      const parsed = loginSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      if (!isProductionDatabaseConfigured) {
        throw new Error("Production database is not configured with a TLS PostgreSQL connection.");
      }

      if (process.env.DEMO_SEED_ON_STARTUP === "true") {
        await ensureSeededDemoAccounts();
      }

      const { key, state } = getAuthAttemptState(parsed.data.email);

      if (state?.lockedUntil && state.lockedUntil > Date.now()) {
        await createFailedLoginAuditEvent({
          email: parsed.data.email,
          ipAddress: getRequestIp(req?.headers as Headers | undefined),
          reason: "rate_limited",
        });
        throw new Error("Too many attempts. Please wait a few minutes and try again.");
      }

      const user = await getUserByEmail(parsed.data.email);

      if (!user || !user.password || user.status !== "ACTIVE") {
        registerFailedAttempt(key);
        await createFailedLoginAuditEvent({
          email: parsed.data.email,
          ipAddress: getRequestIp(req?.headers as Headers | undefined),
          reason: !user ? "user_not_found" : user.status !== "ACTIVE" ? "user_inactive" : "password_missing",
          userId: user?.id,
        });
        return null;
      }

      const isValidPassword = await verifyPassword(parsed.data.password, user.password);

      if (!isValidPassword) {
        registerFailedAttempt(key);
        await createFailedLoginAuditEvent({
          email: parsed.data.email,
          ipAddress: getRequestIp(req?.headers as Headers | undefined),
          reason: "invalid_password",
          userId: user.id,
        });
        return null;
      }

      clearFailedAttempts(key);
      const role = user.role.name as UserRole;
      const permissions = mapRolePermissions(user.role.permissions);

      await createLoginAuditEvent({
        userId: user.id,
        ipAddress: getRequestIp(req?.headers as Headers | undefined),
        provider: "credentials",
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        permissions,
      };
    },
  }),
];

if (isGitHubConfigured) {
  providers.push(
    GitHubProvider({
      clientId: env.githubId,
      clientSecret: env.githubSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: env.authSecret,
  useSecureCookies: env.appUrl.startsWith("https://"),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 15,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: env.appUrl.startsWith("https://")
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.appUrl.startsWith("https://"),
      },
    },
    callbackUrl: {
      name: env.appUrl.startsWith("https://")
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: env.appUrl.startsWith("https://"),
      },
    },
    csrfToken: {
      name: env.appUrl.startsWith("https://")
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.appUrl.startsWith("https://"),
      },
    },
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !user.email) {
        return true;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (existingUser) {
        return true;
      }

      const role = await prisma.role.findUnique({
        where: { name: "USER" },
        select: { id: true },
      });

      if (!role) {
        return false;
      }

      await prisma.user.update({
        where: { email: user.email },
        data: {
          name: user.name ?? "SynapseOS User",
          status: "ACTIVE",
          role: {
            connect: {
              id: role.id,
            },
          },
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role;
      }

      if (Array.isArray(user?.permissions)) {
        token.permissions = user.permissions;
      }

      if (token.sub) {
        if (!token.role) {
          const role = await getUserRoleById(token.sub);
          token.role = role ?? "USER";
        }

        if (!token.permissions?.length && token.role) {
          const permissions = await getUserPermissionsById(token.sub);
          token.permissions = permissions.length ? permissions : getPermissionsForRole(token.role);
        }
      }

      if (!token.role) {
        token.role = "USER";
      }

      if (!token.permissions?.length) {
        token.permissions = getPermissionsForRole(token.role);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? (token.role as UserRole) : "USER";
        session.user.permissions = Array.isArray(token.permissions)
          ? (token.permissions as typeof session.user.permissions)
          : getPermissionsForRole(session.user.role);
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
