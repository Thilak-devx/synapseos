import { z } from "zod";

export const reportExportFormats = ["PDF", "CSV", "JSON"] as const;
export const reportStatusOptions = ["Draft", "Queued", "Processing", "Completed", "Archived"] as const;

export const reportTypeOptions = [
  "Executive Summary",
  "Operational Ledger",
  "Audit Delta",
  "Forecast Model",
  "Exception Feed",
] as const;

export const createReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Report title is required and must be at least 3 characters.")
    .max(160, "Report title must be 160 characters or less."),
  reportType: z
    .string()
    .trim()
    .min(2, "Report type is required."),
  owner: z
    .string()
    .trim()
    .min(2, "Owner is required."),
  requestedAt: z.string().datetime("A valid transaction timestamp is required."),
  exportFormat: z.enum(reportExportFormats),
  status: z.enum(reportStatusOptions).optional(),
  assignedToId: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export type ReportMetricRecord = {
  label: string;
  value: string;
};

export function buildReportMetrics(
  status: "Draft" | "Queued" | "Processing" | "Completed" | "Failed" | "Archived",
): ReportMetricRecord[] {
  return [
    { label: "Workflow status", value: status },
    {
      label: "Persistence tier",
      value: status === "Draft" ? "Draft workspace" : status === "Queued" ? "Transactional queue" : "Committed",
    },
    {
      label: "Delivery mode",
      value: status === "Failed" ? "Recovery required" : status === "Draft" ? "Not queued" : "Ready for export",
    },
  ];
}

export function buildReportSummary(
  reportType: string,
  exportFormat: (typeof reportExportFormats)[number],
) {
  if (exportFormat === "PDF") {
    return `${reportType} prepared for executive review with branded presentation output.`;
  }

  if (exportFormat === "CSV") {
    return `${reportType} prepared as a tabular extract for spreadsheet and audit workflows.`;
  }

  return `${reportType} prepared as a structured machine-readable export for downstream systems.`;
}
