import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error-response";
import { requireApiAuth } from "@/lib/api-auth";
import { createReportSchema } from "@/lib/report-workflow";
import { mapPersistedReportToRecord } from "@/lib/report-record";
import { getRequestIp } from "@/lib/request";
import {
  applyReportLifecycleAction,
  duplicateReportWithTransaction,
  fetchScopedReports,
  updateReportWithTransaction,
} from "@/services/dbms.service";

const reportActionSchema = z.object({
  action: z.enum(["view", "export", "archive", "restore", "regenerate", "duplicate", "update"]),
  payload: createReportSchema.partial().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireApiAuth();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;

  try {
    const reports = await fetchScopedReports({
      includeArchived: true,
      limit: 100,
      role: authorization.session.user.role,
      userId: authorization.session.user.id,
    });
    const report = reports.find((entry) => entry.id === id);

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ report: mapPersistedReportToRecord(report) });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to load the requested report.",
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireApiAuth();

  if (!authorization.ok) {
    return authorization.response;
  }

  const body = await request.json();
  const parsed = reportActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid report action.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    if (parsed.data.action === "update") {
      const payload = parsed.data.payload;

      if (!payload?.title || !payload.reportType || !payload.owner || !payload.exportFormat) {
        return NextResponse.json(
          { error: "Report title, type, owner, and export format are required." },
          { status: 400 },
        );
      }

      const result = await updateReportWithTransaction({
        actorId: authorization.session.user.id,
        exportFormat: payload.exportFormat,
        ipAddress: getRequestIp(request.headers),
        owner: payload.owner,
        reportId: id,
        reportType: payload.reportType,
        role: authorization.session.user.role,
        status: payload.status,
        title: payload.title,
      });

      return NextResponse.json({
        ...result,
        report: mapPersistedReportToRecord(result.report),
      });
    }

    if (parsed.data.action === "duplicate") {
      const result = await duplicateReportWithTransaction({
        actorId: authorization.session.user.id,
        ipAddress: getRequestIp(request.headers),
        reportId: id,
        role: authorization.session.user.role,
      });

      return NextResponse.json({
        ...result,
        report: mapPersistedReportToRecord(result.report),
      });
    }

    const result = await applyReportLifecycleAction({
      action: parsed.data.action,
      actorId: authorization.session.user.id,
      ipAddress: getRequestIp(request.headers),
      reportId: id,
      role: authorization.session.user.role,
    });

    return NextResponse.json({
      ...result,
      report: mapPersistedReportToRecord(result.report),
    });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to update the selected report.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireApiAuth();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;

  try {
    const result = await applyReportLifecycleAction({
      action: "delete",
      actorId: authorization.session.user.id,
      ipAddress: getRequestIp(request.headers),
      reportId: id,
      role: authorization.session.user.role,
    });

    return NextResponse.json({
      ...result,
      report: mapPersistedReportToRecord(result.report),
    });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to delete the selected report.",
    });
  }
}
