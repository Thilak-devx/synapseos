"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CopyPlus,
  ExternalLink,
  FileJson2,
  FileSpreadsheet,
  FileText,
  History,
  LoaderCircle,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ReportRecord } from "@/features/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { buildPdfReportBlob } from "@/lib/report-export";
import { cn } from "@/lib/utils";

const toneMap = {
  Completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Processing: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  Queued: "border-violet-400/20 bg-violet-400/10 text-violet-100",
  Failed: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  Archived: "border-white/12 bg-white/[0.06] text-white/72",
  Draft: "border-slate-300/16 bg-slate-300/10 text-slate-100",
} as const;

const formatIcons = {
  PDF: FileText,
  CSV: FileSpreadsheet,
  JSON: FileJson2,
} as const;

type ReportDetailDialogProps = {
  actionLoading?: {
    archive?: boolean;
    duplicate?: boolean;
    export?: boolean;
    regenerate?: boolean;
    share?: boolean;
  };
  onArchive: (report: ReportRecord) => void;
  onDuplicate: (report: ReportRecord) => void;
  onExport: (report: ReportRecord) => void;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (report: ReportRecord) => void;
  onShare: (report: ReportRecord) => void;
  open: boolean;
  report: ReportRecord | null;
};

export function ReportDetailDialog({
  actionLoading,
  onArchive,
  onDuplicate,
  onExport,
  onOpenChange,
  onRegenerate,
  onShare,
  open,
  report,
}: ReportDetailDialogProps) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !report || report.exportFormat !== "PDF") {
      return;
    }

    let revoked = false;
    let nextUrl: string | null = null;

    void buildPdfReportBlob(report).then((blob) => {
      if (revoked) {
        return;
      }

      nextUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(nextUrl);
    });

    return () => {
      revoked = true;
      if (nextUrl) {
        URL.revokeObjectURL(nextUrl);
      }
    };
  }, [open, report]);
  const activePdfPreviewUrl = open && report?.exportFormat === "PDF" ? pdfPreviewUrl : null;

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const analyticsRows = useMemo(
    () =>
      report
        ? [
            { label: "Rows analyzed", value: report.analytics.rowsAnalyzed.toLocaleString("en-US") },
            { label: "Execution duration", value: `${report.analytics.executionDurationMs} ms` },
            { label: "Transaction count", value: report.analytics.transactionCount.toString() },
            { label: "DB load", value: report.analytics.dbLoad },
            { label: "Security checks", value: report.analytics.securityChecks },
            { label: "Anomaly score", value: `${report.analytics.anomalyScore}/100` },
          ]
        : [],
    [report],
  );

  const FormatIcon = report ? formatIcons[report.exportFormat] : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] w-screen max-w-none overflow-hidden rounded-none border-white/10 bg-[#020817] p-0 text-white shadow-lg shadow-black/10 sm:h-[94vh] sm:w-[92vw] sm:!max-w-[92vw] sm:rounded-[2rem] lg:w-[96vw] lg:!max-w-7xl">
        {report ? (
          <>
            <DialogHeader className="border-b border-white/8 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="type-caption text-cyan-100/65">Report inspector</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className={cn("rounded-full border", toneMap[report.status])}>
                      {report.status}
                    </Badge>
                    <Badge className="rounded-full border border-white/10 bg-white/[0.04] text-white/70">
                      {report.exportFormat}
                    </Badge>
                    <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                      {report.type}
                    </Badge>
                  </div>
                  <DialogTitle className="type-heading mt-4 text-xl text-white sm:text-2xl lg:text-3xl">
                    {report.title}
                  </DialogTitle>
                  <DialogDescription className="type-body mt-3 max-w-3xl leading-7 text-white/58">
                    {report.metadata.summary}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="min-w-[170px] flex-1 rounded-xl border-white/10 bg-white/[0.04] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => onShare(report)}
                    disabled={actionLoading?.share}
                  >
                    {actionLoading?.share ? <LoaderCircle className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                    Share report
                  </Button>
                  <Button
                    variant="outline"
                    className="min-w-[170px] flex-1 rounded-xl border-white/10 bg-white/[0.04] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => onDuplicate(report)}
                    disabled={actionLoading?.duplicate}
                  >
                    {actionLoading?.duplicate ? <LoaderCircle className="size-4 animate-spin" /> : <CopyPlus className="size-4" />}
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    className="min-w-[170px] flex-1 rounded-xl border-white/10 bg-white/[0.04] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => onRegenerate(report)}
                    disabled={actionLoading?.regenerate}
                  >
                    {actionLoading?.regenerate ? <LoaderCircle className="size-4 animate-spin" /> : <Zap className="size-4" />}
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    className="min-w-[170px] flex-1 rounded-xl border-rose-400/18 bg-rose-400/8 text-rose-100 transition hover:bg-rose-400/14 hover:text-rose-50"
                    onClick={() => onArchive(report)}
                    disabled={actionLoading?.archive || report.status === "Archived"}
                  >
                    {actionLoading?.archive ? <LoaderCircle className="size-4 animate-spin" /> : <Archive className="size-4" />}
                    {report.status === "Archived" ? "Archived" : "Archive"}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="h-[calc(92vh-220px)] overflow-y-auto overflow-x-hidden">
              <div className="grid gap-6 px-4 py-4 sm:px-6 sm:py-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="min-w-0 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="type-caption text-white/38">Report ID</p>
                      <p className="type-mono mt-3 break-all text-sm text-white">{report.id}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="type-caption text-white/38">Transaction ID</p>
                      <p className="type-mono mt-3 break-all text-sm text-white">{report.transactionId ?? report.id}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="type-caption text-white/38">Owner</p>
                      <p className="mt-3 text-sm text-white">{report.owner}</p>
                      <p className="mt-1 text-xs text-white/45">{report.ownerScope ?? "Workspace scoped"}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <p className="type-caption text-white/38">Created</p>
                      <p className="type-mono mt-3 text-sm text-white">
                        {new Date(report.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FormatIcon className="size-4 text-cyan-100" />
                        <p className="type-heading text-base text-white">Report preview</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-white/10 bg-white/[0.04] text-white transition hover:border-cyan-300/18 hover:bg-white/[0.08] hover:text-white sm:w-auto"
                        onClick={() => onExport(report)}
                        disabled={actionLoading?.export}
                      >
                        {actionLoading?.export ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                        Download {report.exportFormat}
                      </Button>
                    </div>

                    {report.exportFormat === "PDF" ? (
                      !activePdfPreviewUrl ? (
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-40 rounded-full" />
                          <Skeleton className="h-[420px] w-full rounded-[1.4rem]" />
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#040812]">
                          <iframe
                            title={`${report.title} preview`}
                            src={activePdfPreviewUrl}
                            className="h-[360px] w-full sm:h-[480px] lg:h-[620px]"
                          />
                        </div>
                      )
                    ) : null}

                    {report.exportFormat === "CSV" ? (
                      <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#040812]">
                        <div className="grid grid-cols-4 gap-3 border-b border-white/8 bg-white/[0.05] px-4 py-3">
                          {report.preview.columns?.map((column) => (
                            <span key={column} className="type-caption text-white/40">
                              {column}
                            </span>
                          ))}
                        </div>
                        <div className="divide-y divide-white/8">
                          {report.preview.rows?.map((row, index) => (
                            <div key={`${report.id}-${index}`} className="grid grid-cols-4 gap-3 px-4 py-3 text-sm text-white/72">
                              {row.map((cell) => (
                                <span key={cell} className="min-w-0 break-words">
                                  {cell}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {report.exportFormat === "JSON" ? (
                      <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#040812]">
                        <pre className="type-mono max-h-[560px] overflow-hidden whitespace-pre-wrap break-all px-4 py-4 text-[11px] leading-7 text-cyan-100/90 sm:px-5">
                          <code>{JSON.stringify(report.preview.json, null, 2)}</code>
                        </pre>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {report.preview.highlights.map((highlight) => (
                        <div key={highlight} className="rounded-[1.2rem] border border-white/8 bg-black/20 p-3 text-sm leading-6 text-white/62">
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-5">
                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-cyan-100" />
                      <p className="type-heading text-base text-white">Analytics summary</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      {analyticsRows.map((item) => (
                        <div key={item.label} className="flex min-h-[120px] items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 p-5">
                          <span className="text-sm text-white/52">{item.label}</span>
                          <span className="type-metric text-sm text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
                    <p className="type-heading text-base text-white">Attached metrics</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      {report.metadata.metrics.map((metric) => (
                        <div key={metric.label} className="flex min-h-[120px] items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 p-5">
                          <span className="text-sm text-white/52">{metric.label}</span>
                          <span className="type-metric text-sm text-white">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
                    <div className="flex items-center gap-2">
                      <History className="size-4 text-cyan-100" />
                      <p className="type-heading text-base text-white">Activity history</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {report.activityHistory.map((entry) => (
                        <div key={entry.id} className="rounded-[1.1rem] border border-white/8 bg-black/20 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{entry.action}</p>
                            <span className="type-caption text-white/35">{entry.timestamp}</span>
                          </div>
                          <p className="mt-1 text-xs text-white/45">{entry.actor}</p>
                          <p className="mt-2 text-sm leading-6 text-white/58">{entry.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
