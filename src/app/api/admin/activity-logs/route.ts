import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { fetchActivityLogs } from "@/services/dbms.service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN", "MANAGER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const limit = Number(searchParams.get("limit") ?? "50");
    const logs = await fetchActivityLogs(Number.isFinite(limit) ? limit : 50);

    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load activity logs.",
    });
  }
}
