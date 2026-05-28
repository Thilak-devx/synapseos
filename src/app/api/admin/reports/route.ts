import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { requireApiRole } from "@/lib/api-auth";
import { createReportSchema } from "@/lib/report-workflow";
import { mapPersistedReportToRecord, toPersistedReportStatus } from "@/lib/report-record";
import { getRequestIp } from "@/lib/request";
import { fetchScopedReports, generateReportWithTransaction } from "@/services/dbms.service";

export async function GET(request: Request) {
  const authorization = await requireApiRole(["ADMIN", "MANAGER"]);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { searchParams } = new URL(request.url);
  try {
    const limit = Number(searchParams.get("limit") ?? "50");
    const reports = await fetchScopedReports({
      limit: Number.isFinite(limit) ? limit : 50,
      role: authorization.session.user.role,
      userId: authorization.session.user.id,
    });

    return NextResponse.json({ reports: reports.map(mapPersistedReportToRecord) });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load reports.",
    });
  }
}

export async function POST(request: Request) {
  const authorization = await requireApiRole(["ADMIN", "MANAGER"]);

  if (!authorization.ok) {
    return authorization.response;
  }

  const body = await request.json();
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError =
      Object.values(fieldErrors).flat().find(Boolean) ?? "Invalid report payload.";
    return NextResponse.json(
      { error: firstError, fieldErrors },
      { status: 400 },
    );
  }

  try {
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.floor(Math.random() * 700)),
    );

    const workflow = await generateReportWithTransaction({
      title: parsed.data.title,
      assignedToId: parsed.data.assignedToId,
      exportFormat: parsed.data.exportFormat,
      generatedById: authorization.session.user.id,
      ipAddress: getRequestIp(request.headers),
      owner: parsed.data.owner,
      ownerScope:
        authorization.session.user.role === "ADMIN"
          ? "Global workspace"
          : "Department workspace",
      reportType: parsed.data.reportType,
      status: toPersistedReportStatus(parsed.data.status),
    });

    const report = mapPersistedReportToRecord(workflow.report);

    return NextResponse.json(
      {
        activityLog: workflow.activityLog,
        notification: workflow.notification,
        report,
        systemMetric: workflow.systemMetric,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Failed to persist report.",
    });
  }
}
