"use client";

import { jsPDF } from "jspdf";
import type { ReportRecord } from "@/features/dashboard/types";

type ExportableReportInput = ReportRecord | ReportRecord[];

function sanitizeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildReportJsonPayload(input: ExportableReportInput) {
  return Array.isArray(input)
    ? {
        generatedAt: new Date().toISOString(),
        reportCount: input.length,
        reports: input,
      }
    : {
        generatedAt: new Date().toISOString(),
        report: input,
      };
}

export function buildReportCsvContent(input: ExportableReportInput) {
  const reports = Array.isArray(input) ? input : [input];
  const rows = [
    [
      "Report ID",
      "Title",
      "Type",
      "Owner",
      "Status",
      "Created At",
      "Displayed Time",
      "Export Format",
      "Summary",
      "Metrics",
    ],
    ...reports.map((report) => [
      report.id,
      report.title,
      report.type,
      report.owner,
      report.status,
      report.createdAt,
      report.generatedAt,
      report.exportFormat,
      report.metadata.summary,
      report.metadata.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" | "),
    ]),
  ];

  return rows.map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
}

export function buildPdfReportBlob(report: ReportRecord) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, 595, 842, "F");

  doc.setFillColor(18, 34, 59);
  doc.roundedRect(36, 36, 523, 110, 24, 24, "F");

  doc.setTextColor(103, 232, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SYNAPSEOS", 56, 68);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(report.title, 56, 102);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(183, 201, 224);
  doc.text(`${report.type} - ${report.status} - ${report.owner}`, 56, 128);

  doc.setFillColor(10, 17, 31);
  doc.roundedRect(36, 170, 523, 530, 24, 24, "F");

  const rows = [
    ["Report ID", report.id],
    ["Owner", report.owner],
    ["Created At", report.createdAt],
    ["Displayed Time", report.generatedAt],
    ["Export Format", report.exportFormat],
    ["Generated Timestamp", generatedAt],
    ["Rows analyzed", report.analytics.rowsAnalyzed.toLocaleString("en-US")],
    ["Execution duration", `${report.analytics.executionDurationMs} ms`],
    ["Transaction count", report.analytics.transactionCount.toString()],
    ["Security checks", report.analytics.securityChecks],
  ];

  let y = 208;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("Report Summary", 56, y);

  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(196, 208, 226);

  for (const [label, value] of rows) {
    doc.setTextColor(137, 156, 184);
    doc.text(label, 56, y);
    doc.setTextColor(255, 255, 255);
    doc.text(value, 210, y);
    y += 24;
  }

  y += 12;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Metrics Summary", 56, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(196, 208, 226);
  for (const metric of report.metadata.metrics) {
    doc.setTextColor(137, 156, 184);
    doc.text(metric.label, 56, y);
    doc.setTextColor(255, 255, 255);
    doc.text(metric.value, 210, y);
    y += 22;
  }

  y += 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Operational Note", 56, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(196, 208, 226);
  const summaryLines = doc.splitTextToSize(report.metadata.summary, 460);
  doc.text(summaryLines, 56, y);

  doc.setDrawColor(38, 56, 86);
  doc.line(56, 760, 539, 760);
  doc.setTextColor(137, 156, 184);
  doc.setFontSize(10);
  doc.text("SynapseOS - AI-powered DBMS infrastructure management", 56, 786);
  doc.text(`Generated ${generatedAt}`, 425, 786);

  return doc.output("blob");
}

function createFilename(report: ReportRecord, extension: "pdf" | "csv" | "json") {
  const title = sanitizeFilenamePart(report.title) || "synapseos-report";
  const id = sanitizeFilenamePart(report.id) || "report";
  return `${title}-${id}.${extension}`;
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

export async function generatePdfReport(report: ReportRecord) {
  triggerDownload(createFilename(report, "pdf"), buildPdfReportBlob(report));
}

export async function generateCsvReport(input: ExportableReportInput) {
  const csv = buildReportCsvContent(input);
  const filename = Array.isArray(input)
    ? `synapseos-reports-manifest-${Date.now()}.csv`
    : createFilename(input, "csv");
  triggerDownload(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export async function generateJsonReport(input: ExportableReportInput) {
  const filename = Array.isArray(input)
    ? `synapseos-reports-manifest-${Date.now()}.json`
    : createFilename(input, "json");

  const payload = buildReportJsonPayload(input);

  triggerDownload(
    filename,
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
  );
}

export async function exportReport(report: ReportRecord) {
  if (report.exportFormat === "PDF") {
    return generatePdfReport(report);
  }

  if (report.exportFormat === "JSON") {
    return generateJsonReport(report);
  }

  return generateCsvReport(report);
}

