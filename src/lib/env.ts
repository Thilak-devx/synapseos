import { z } from "zod";

const fallbackDatabaseUrl = "";

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  DEFAULT_ADMIN_EMAIL: z.string().email().optional(),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).optional(),
  DEFAULT_ADMIN_NAME: z.string().min(2).optional(),
  DEMO_SEED_ON_STARTUP: z.enum(["true", "false"]).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success && process.env.NODE_ENV === "production") {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ")}`,
  );
}

const values = parsedEnv.success ? parsedEnv.data : process.env;

export const env = {
  appName: "SynapseOS",
  appUrl:
    values.NEXTAUTH_URL ?? values.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  authSecret:
    values.NEXTAUTH_SECRET ??
    values.AUTH_SECRET ??
    "replace-with-a-long-random-secret",
  databaseUrl: values.DATABASE_URL ?? fallbackDatabaseUrl,
  githubId: values.AUTH_GITHUB_ID ?? "",
  githubSecret: values.AUTH_GITHUB_SECRET ?? "",
  defaultAdminEmail: (values.DEFAULT_ADMIN_EMAIL ?? "admin@synapseos.dev").toLowerCase(),
  defaultAdminPassword: values.DEFAULT_ADMIN_PASSWORD ?? "admin123",
  defaultAdminName: values.DEFAULT_ADMIN_NAME ?? "SynapseOS Admin",
  demoSeedOnStartup: values.DEMO_SEED_ON_STARTUP === "true",
};

export const isDatabaseConfigured =
  Boolean(values.DATABASE_URL) &&
  env.databaseUrl !== fallbackDatabaseUrl &&
  env.databaseUrl.startsWith("postgresql://");

export const isProductionDatabaseConfigured =
  process.env.NODE_ENV !== "production" ||
  (env.databaseUrl.startsWith("postgresql://") &&
    env.databaseUrl.includes("sslmode=require"));

export const isGitHubConfigured =
  Boolean(values.AUTH_GITHUB_ID) && Boolean(values.AUTH_GITHUB_SECRET);
