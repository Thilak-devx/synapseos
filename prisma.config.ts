import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Vercel injects env vars directly; local .env loading is best-effort.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file=.env prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
