import type { ReportRecord } from "@/features/dashboard/types";
import { buildReportMetrics, buildReportSummary } from "@/lib/report-workflow";

type PersistedReportLike = {
  archivedAt?: Date | string | null;
  analytics?: unknown;
  createdAt: Date | string;
  deletedAt?: Date | string | null;
  exportFormat: string;
  id: string;
  isArchived?: boolean;
  lastViewedAt?: Date | string | null;
  metrics?: unknown;
  ownerLabel?: string | null;
  ownerScope?: string | null;
  preview?: unknown;
  reportType: string;
  status: string;
  summary?: string | null;
  title: string;
  transactionId?: string | null;
  assignedTo?: {
    name?: string | null;
  } | null;
  generatedBy?: {
    name?: string | null;
  } | null;
};

function toIsoString(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toStatusLabel(status: string, isArchived?: boolean): ReportRecord["status"] {
  if (isArchived || status === "ARCHIVED") {
    return "Archived";
  }

  if (status === "DRAFT") {
    return "Draft";
  }

  if (status === "PROCESSING") {
    return "Processing";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "FAILED") {
    return "Failed";
  }

  return "Queued";
}

function normalizeExportFormat(value: string): ReportRecord["exportFormat"] {
  if (value === "PDF" || value === "CSV" || value === "JSON") {
    return value;
  }

  return "JSON";
}

function isMetricArray(value: unknown): value is NonNullable<ReportRecord["metrics"]> {
  return Array.isArray(value);
}

function isAnalytics(value: unknown): value is ReportRecord["analytics"] {
  return Boolean(value && typeof value === "object" && "rowsAnalyzed" in value);
}

function isPreview(value: unknown): value is ReportRecord["preview"] {
  return Boolean(value && typeof value === "object" && "highlights" in value);
}

export function mapPersistedReportToRecord(report: PersistedReportLike): ReportRecord {
  const exportFormat = normalizeExportFormat(report.exportFormat);
  const status = toStatusLabel(report.status, report.isArchived);
  const createdAt = toIsoString(report.createdAt) ?? new Date().toISOString();
  const owner = report.ownerLabel ?? report.assignedTo?.name ?? report.generatedBy?.name ?? "SynapseOS";
  const metrics: NonNullable<ReportRecord["metrics"]> = isMetricArray(report.metrics)
    ? report.metrics
    : buildReportMetrics(status === "Archived" ? "Completed" : status);

  return {
    id: report.id,
    title: report.title,
    type: report.reportType,
    owner,
    status,
    lastActiveStatus: status === "Archived" ? "Completed" : status,
    generatedAt: new Date(createdAt).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt,
    archivedAt: toIsoString(report.archivedAt),
    deletedAt: toIsoString(report.deletedAt),
    exportFormat,
    isArchived: report.isArchived ?? status === "Archived",
    transactionId: report.transactionId ?? report.id,
    ownerScope: report.ownerScope ?? "Personal workspace",
    metrics,
    analytics: isAnalytics(report.analytics)
      ? report.analytics
      : {
          rowsAnalyzed: 1800 + report.title.length * 48,
          executionDurationMs: status === "Completed" ? 942 : status === "Failed" ? 1760 : 1260,
          transactionCount: status === "Archived" ? 10 : 14,
          dbLoad: status === "Failed" ? "14.1 GB" : "8.9 GB",
          securityChecks: status === "Failed" ? "4 of 5 passed" : "5 of 5 passed",
          anomalyScore: status === "Failed" ? 74 : status === "Archived" ? 14 : 29,
        },
    preview: isPreview(report.preview)
      ? report.preview
      : {
          highlights: [
            `${report.reportType} prepared for ${exportFormat} delivery`,
            `${status} state reflected across reporting analytics`,
            `${owner} remains the current accountable owner`,
          ],
        },
    activityHistory: [
      {
        id: `${report.id}-persisted`,
        action: "Report persisted",
        actor: owner,
        timestamp: "Just now",
        detail: "The report state was loaded from the Prisma-backed reporting workflow.",
      },
    ],
    metadata: {
      summary: report.summary ?? buildReportSummary(report.reportType, exportFormat),
      metrics,
    },
  };
}

export function toPersistedReportStatus(status?: string) {
  if (status === "Draft") {
    return "DRAFT";
  }

  if (status === "Processing") {
    return "PROCESSING";
  }

  if (status === "Completed") {
    return "COMPLETED";
  }

  if (status === "Archived") {
    return "ARCHIVED";
  }

  return "QUEUED";
}
