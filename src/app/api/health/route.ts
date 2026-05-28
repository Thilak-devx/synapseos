import { NextResponse } from "next/server";
import { isDatabaseConfigured, isGitHubConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    integrations: {
      databaseConfigured: isDatabaseConfigured,
      githubAuthConfigured: isGitHubConfigured,
    },
  });
}
