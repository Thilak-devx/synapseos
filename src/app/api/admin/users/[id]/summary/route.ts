import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-response";
import { hasRoleAccess } from "@/lib/rbac";
import { getUserSummaryReport } from "@/services/dbms.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const summary = await getUserSummaryReport(id);

    return NextResponse.json({ summary });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load the user summary report.",
    });
  }
}
