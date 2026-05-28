import { buildReportMetrics, buildReportSummary } from "@/lib/report-workflow";

type ReportStatusLabel = "Draft" | "Queued" | "Processing" | "Completed" | "Failed" | "Archived";

function normalizeStatus(status: string, isArchived?: boolean): ReportStatusLabel {
  if (isArchived) {
    return "Archived";
  }

  if (status === "PROCESSING") {
    return "Processing";
  }

  if (status === "DRAFT") {
    return "Draft";
  }

  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "FAILED") {
    return "Failed";
  }

  return "Queued";
}

export function buildPersistedReportArtifacts(input: {
  exportFormat: "PDF" | "CSV" | "JSON";
  owner: string;
  ownerScope: string;
  reportType: string;
  status: string;
  title: string;
  transactionId: string;
}) {
  const statusLabel = normalizeStatus(input.status);
  const seed = input.title.length + input.reportType.length + input.owner.length;

  return {
    summary: buildReportSummary(input.reportType, input.exportFormat),
    metrics: buildReportMetrics(statusLabel === "Archived" ? "Completed" : statusLabel),
    analytics: {
      rowsAnalyzed: 1800 + seed * 42,
      executionDurationMs:
        statusLabel === "Completed"
          ? 860 + seed * 7
          : statusLabel === "Failed"
            ? 1620 + seed * 10
            : 1220 + seed * 8,
      transactionCount:
        statusLabel === "Completed" || statusLabel === "Archived"
          ? 14 + (seed % 6)
          : 8 + (seed % 5),
      dbLoad:
        statusLabel === "Failed"
          ? "14.1 GB"
          : `${(8.4 + (seed % 7) * 0.9).toFixed(1)} GB`,
      securityChecks: statusLabel === "Failed" ? "4 of 5 passed" : "5 of 5 passed",
      anomalyScore:
        statusLabel === "Failed"
          ? 78
          : statusLabel === "Processing"
            ? 42
            : statusLabel === "Archived"
              ? 15
              : 23,
    },
    preview:
      input.exportFormat === "CSV"
        ? {
            columns: ["Segment", "Rows", "Delta", "Owner"],
            rows: [
              ["North America", "1284", "+12.4%", input.owner],
              ["EMEA", "942", "+8.1%", input.owner],
              ["APAC", "1106", "+10.2%", input.owner],
            ],
            highlights: [
              `${input.reportType} workflow bound to CSV delivery`,
              `${statusLabel} state mirrored across reporting analytics and audit surfaces`,
              `Prepared for ${input.owner} with SynapseOS compliance-grade metadata`,
            ],
          }
        : input.exportFormat === "JSON"
          ? {
              json: {
                reportType: input.reportType,
                owner: input.owner,
                ownerScope: input.ownerScope,
                status: statusLabel,
                delivery: input.exportFormat,
                transactionId: input.transactionId,
                controls: {
                  auditReady: true,
                  encrypted: true,
                  shareable: statusLabel === "Completed" || statusLabel === "Archived",
                },
              },
              highlights: [
                `${input.reportType} workflow bound to JSON delivery`,
                `${statusLabel} state mirrored across reporting analytics and audit surfaces`,
                `Prepared for ${input.owner} with SynapseOS compliance-grade metadata`,
              ],
            }
          : {
              highlights: [
                `${input.reportType} workflow bound to PDF delivery`,
                `${statusLabel} state mirrored across reporting analytics and audit surfaces`,
                `Prepared for ${input.owner} with SynapseOS compliance-grade metadata`,
              ],
            },
  };
}
