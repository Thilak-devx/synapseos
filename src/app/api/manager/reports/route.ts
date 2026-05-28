import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { requireApiRole } from "@/lib/api-auth";
import { mapPersistedReportToRecord } from "@/lib/report-record";
import { fetchScopedReports } from "@/services/dbms.service";

export async function GET(request: Request) {
  const authorization = await requireApiRole(["ADMIN", "MANAGER"]);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { searchParams } = new URL(request.url);

  try {
    const limit = Number(searchParams.get("limit") ?? "25");
    const reports = await fetchScopedReports({
      includeArchived: true,
      limit: Number.isFinite(limit) ? limit : 25,
      role: authorization.session.user.role,
      userId: authorization.session.user.id,
    });

    return NextResponse.json({ reports: reports.map(mapPersistedReportToRecord) });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load department reports.",
    });
  }
}
