try {
  process.loadEnvFile?.(".env.local");
} catch {
  // Production platforms inject env vars directly.
}

try {
  process.loadEnvFile?.(".env");
} catch {
  // Local .env is optional when .env.local or platform env vars are present.
}

await import("../src/prisma/seed.mjs");
