import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { getMonthlyAnalyticsReport } from "@/services/dbms.service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const month = searchParams.get("month") ?? undefined;
    const report = await getMonthlyAnalyticsReport(month);

    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load the monthly analytics report.",
    });
  }
}
