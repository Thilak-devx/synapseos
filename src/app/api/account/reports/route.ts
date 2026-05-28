import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-response";
import { createReportSchema } from "@/lib/report-workflow";
import { requireApiAuth } from "@/lib/api-auth";
import { getRequestIp } from "@/lib/request";
import { mapPersistedReportToRecord, toPersistedReportStatus } from "@/lib/report-record";
import { fetchScopedReports, generateReportWithTransaction } from "@/services/dbms.service";

export async function GET() {
  const authorization = await requireApiAuth();

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const scopedReports = await fetchScopedReports({
      limit: 50,
      role: authorization.session.user.role,
      userId: authorization.session.user.id,
    });

    return NextResponse.json({ reports: scopedReports.map(mapPersistedReportToRecord) });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load personal reports.",
    });
  }
}

export async function POST(request: Request) {
  const authorization = await requireApiAuth();

  if (!authorization.ok) {
    return authorization.response;
  }

  const body = await request.json();
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError =
      Object.values(fieldErrors).flat().find(Boolean) ?? "Invalid report payload.";
    return NextResponse.json({ error: firstError, fieldErrors }, { status: 400 });
  }

  try {
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.floor(Math.random() * 700)),
    );

    const workflow = await generateReportWithTransaction({
      title: parsed.data.title,
      assignedToId: authorization.session.user.id,
      exportFormat: parsed.data.exportFormat,
      generatedById: authorization.session.user.id,
      ipAddress: getRequestIp(request.headers),
      owner: parsed.data.owner,
      ownerScope:
        authorization.session.user.role === "MANAGER"
          ? "Department workspace"
          : "Personal workspace",
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
      defaultMessage: "Failed to persist personal report.",
    });
  }
}
