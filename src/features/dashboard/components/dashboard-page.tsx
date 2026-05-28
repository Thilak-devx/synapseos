"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArchiveRestore,
  ArrowUpRight,
  BellRing,
  Bot,
  ChartNoAxesCombined,
  Check,
  Cpu,
  DatabaseZap,
  Download,
  FileJson2,
  FileSpreadsheet,
  FileText,
  Filter,
  HardDrive,
  ImageUp,
  KeyRound,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Radar,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { useNotificationCenter } from "@/components/providers/notification-center-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { AccessGate } from "@/components/auth/access-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDetailDialog } from "@/features/dashboard/components/report-detail-dialog";
import { exportReport, generateJsonReport } from "@/lib/report-export";
import {
  buildReportMetrics,
  buildReportSummary,
  createReportSchema,
  reportTypeOptions,
} from "@/lib/report-workflow";
import { cn } from "@/lib/utils";
import { APP_ROLES, ROLE_PERMISSIONS } from "@/lib/rbac";
import { getDashboardSectionMeta } from "@/services/dashboard-meta";
import { AnimatedCounter } from "@/features/dashboard/components/animated-counter";
import type {
  ActivityFeedItem,
  ActivityTimelinePoint,
  DashboardChartPoint,
  DashboardSnapshot,
  NotificationCenterItem,
  ReportRecord,
  SystemMetricRecord,
  TransactionMonitorRecord,
  UserDirectoryRecord,
} from "@/features/dashboard/types";
import type { DashboardSection, UserRole } from "@/types";

const sectionIcons = {
  overview: Sparkles,
  analytics: ChartNoAxesCombined,
  reports: Layers3,
  settings: ShieldCheck,
  users: UsersRound,
  profile: ShieldCheck,
  departments: ShieldCheck,
  team: UsersRound,
  "activity-logs": Bot,
  "system-metrics": Cpu,
  notifications: BellRing,
} as const;

const toneMap = {
  Active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Provisioning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  Suspended: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  Completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Processing: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  Queued: "border-violet-400/20 bg-violet-400/10 text-violet-100",
  Failed: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  Archived: "border-white/12 bg-white/[0.06] text-white/72",
  Draft: "border-slate-300/16 bg-slate-300/10 text-slate-100",
  Online: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  Focus: "border-violet-400/20 bg-violet-400/10 text-violet-100",
  Review: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  Info: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  Warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  Critical: "border-rose-400/20 bg-rose-400/10 text-rose-100",
} as const;

type UserStatusFilter = "ALL" | "Active" | "Provisioning" | "Suspended";
type ReportStatusFilter = "ALL" | ReportRecord["status"];
type ActivitySeverityFilter = "ALL" | ActivityFeedItem["severity"];
type ReportLifecycleFilter = "ACTIVE" | "ARCHIVED" | "ALL";
type ReportSortOption = "newest" | "oldest" | "status" | "owner";
type AdminWorkspaceTab = "overview" | "security" | "analytics" | "reports" | "users" | "monitoring";
type LiveAlert = {
  id: string;
  title: string;
  message: string;
  severity: ActivityFeedItem["severity"];
  timestamp: string;
};
type DashboardPreferencesState = {
  themePreference: string;
  notificationPreference: string;
  density: string;
};
type ReportTransactionStage =
  | "idle"
  | "validating"
  | "committing"
  | "persisting"
  | "completed";
type ReportFormState = {
  title: string;
  reportType: string;
  owner: string;
  requestedAt: string;
  exportFormat: ReportRecord["exportFormat"];
  status: "Draft" | "Queued" | "Processing" | "Completed" | "Failed";
};
type ReportFormErrors = Partial<Record<keyof ReportFormState, string>>;
type ReportActionKey = "archive" | "delete" | "duplicate" | "export" | "regenerate" | "restore" | "share";
type AdminUserFormState = {
  department: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
};

const reportFormatIconMap = {
  PDF: FileText,
  CSV: FileSpreadsheet,
  JSON: FileJson2,
} as const;

const defaultSettingsState: DashboardPreferencesState = {
  themePreference: "system",
  notificationPreference: "priority",
  density: "comfortable",
};

const defaultAdminUserForm: AdminUserFormState = {
  department: "General",
  email: "",
  name: "",
  password: "ChangeMe123",
  role: "USER",
  status: "ACTIVE",
};

const adminWorkspaceTabs: Array<{
  id: AdminWorkspaceTab;
  label: string;
  description: string;
}> = [
  { id: "overview", label: "Overview", description: "Health and executive metrics" },
  { id: "security", label: "Security", description: "RBAC, alerts, audit signals" },
  { id: "analytics", label: "Analytics", description: "Charts and database trends" },
  { id: "reports", label: "Reports", description: "Report workflows and exports" },
  { id: "users", label: "Users", description: "Identity management" },
  { id: "monitoring", label: "Monitoring", description: "DBMS and system health" },
];

function createClientId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function getDefaultReportForm(owner: string): ReportFormState {
  return {
    title: "",
    reportType: reportTypeOptions[0],
    owner,
    requestedAt: new Date().toISOString(),
    exportFormat: "PDF",
    status: "Queued",
  };
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clampMetric(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function jitterMetricValue(value: number, amount: number, min: number, max: number) {
  return clampMetric(value + (Math.random() * amount * 2 - amount), min, max);
}

function getLiveChartLabel() {
  return new Intl.DateTimeFormat("en-US", {
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function pickLiveTemplate<T>(templates: T[], tick: number) {
  return templates[tick % templates.length];
}

const liveActivityTemplates: Array<{
  action: string;
  actor: string;
  category: NotificationCenterItem["category"];
  message: string;
  resource: string;
  severity: ActivityFeedItem["severity"];
  title: string;
}> = [
  {
    action: "authenticated into the control plane",
    actor: "Maya Chen",
    category: "Security",
    message: "A secure operator session was validated by RBAC middleware.",
    resource: "Identity perimeter",
    severity: "Info",
    title: "User login verified",
  },
  {
    action: "generated compliance report",
    actor: "Report Engine",
    category: "Workflow",
    message: "A DBMS-backed report completed and is available for export.",
    resource: "Operational Reports",
    severity: "Info",
    title: "Report generated",
  },
  {
    action: "updated permission boundary",
    actor: "RBAC Guard",
    category: "Security",
    message: "Role permissions were synchronized across protected routes.",
    resource: "Permission Matrix",
    severity: "Warning",
    title: "Permission updated",
  },
  {
    action: "flagged suspicious login attempt",
    actor: "Threat Monitor",
    category: "Incident",
    message: "A login attempt was challenged and preserved in audit logs.",
    resource: "Auth Gateway",
    severity: "Critical",
    title: "Suspicious login blocked",
  },
  {
    action: "completed encrypted backup",
    actor: "Backup Worker",
    category: "Workflow",
    message: "Snapshot backup completed with referential checks intact.",
    resource: "PostgreSQL Cluster",
    severity: "Info",
    title: "Backup completed",
  },
  {
    action: "confirmed replication sync",
    actor: "Replication Agent",
    category: "Workflow",
    message: "Replica lag returned to the healthy operating window.",
    resource: "Read Replica",
    severity: "Info",
    title: "Replication synced",
  },
  {
    action: "completed anomaly scan",
    actor: "SynapseOS AI",
    category: "Incident",
    message: "AI analysis finished with no unresolved critical actions.",
    resource: "AI Operations Layer",
    severity: "Warning",
    title: "AI analysis completed",
  },
];

const liveAlertTemplates: Array<Omit<LiveAlert, "id" | "timestamp">> = [
  {
    title: "Latency spike contained",
    message: "Query latency briefly exceeded baseline and recovered after queue balancing.",
    severity: "Warning",
  },
  {
    title: "Unauthorized access attempt",
    message: "A restricted workspace route was denied and recorded in the audit stream.",
    severity: "Critical",
  },
  {
    title: "High CPU watch",
    message: "CPU pressure entered monitored range while transaction throughput increased.",
    severity: "Warning",
  },
  {
    title: "Replication delay resolved",
    message: "Replica synchronization drift returned under the enterprise threshold.",
    severity: "Info",
  },
  {
    title: "Failed login burst",
    message: "Multiple invalid credentials were throttled by the authentication guard.",
    severity: "Critical",
  },
];

function updateLiveSystemMetric(metric: SystemMetricRecord): SystemMetricRecord {
  const lowerBound = metric.unit === "sessions" ? 80 : metric.unit === "ms" ? 80 : 18;
  const upperBound =
    metric.unit === "sessions" ? Math.max(260, metric.threshold + 90) :
    metric.unit === "ms" ? Math.max(260, metric.threshold + 80) :
    metric.unit === "GB" ? Math.max(96, metric.threshold + 24) :
    98;
  const amount = metric.unit === "sessions" ? 12 : metric.unit === "ms" ? 10 : metric.unit === "GB" ? 3 : 5;
  const nextCurrent = jitterMetricValue(metric.current, amount, lowerBound, upperBound);

  return {
    ...metric,
    current: nextCurrent,
    trend: [...metric.trend.slice(-9), nextCurrent],
  };
}

function updateLiveChartSeries(series: DashboardChartPoint[], metrics: SystemMetricRecord[]) {
  const previous = series.at(-1);
  const cpu = metrics.find((metric) => metric.label.toLowerCase().includes("cpu"))?.current ?? previous?.cpuUsage ?? 52;
  const memory = metrics.find((metric) => metric.label.toLowerCase().includes("memory"))?.current ?? previous?.memoryUsage ?? 61;
  const sessions = metrics.find((metric) => metric.label.toLowerCase().includes("session"))?.current ?? previous?.activeUsers ?? 132;
  const latency = metrics.find((metric) => metric.label.toLowerCase().includes("latency"))?.current ?? previous?.latency ?? 142;
  const nextPoint: DashboardChartPoint = {
    label: getLiveChartLabel(),
    users: jitterMetricValue(previous?.users ?? sessions, 7, 60, 360),
    activeUsers: jitterMetricValue(previous?.activeUsers ?? sessions, 6, 40, 320),
    activities: jitterMetricValue(previous?.activities ?? 34, 5, 8, 120),
    reports: jitterMetricValue(previous?.reports ?? 18, 3, 4, 90),
    cpuUsage: cpu,
    memoryUsage: memory,
    traffic: jitterMetricValue(previous?.traffic ?? 520, 45, 260, 980),
    latency,
    focusScore: jitterMetricValue(previous?.focusScore ?? 82, 3, 64, 99),
    teamVelocity: jitterMetricValue(previous?.teamVelocity ?? 74, 4, 48, 98),
  };

  return [...series.slice(-8), nextPoint];
}

function buildLiveActivity(
  template: (typeof liveActivityTemplates)[number],
  tick: number,
): ActivityFeedItem {
  return {
    id: createClientId(`LIVE-${tick}`),
    actor: template.actor,
    action: template.action,
    resource: template.resource,
    timestamp: formatTimestamp(),
    severity: template.severity,
    ipAddress: `10.42.${(tick * 17) % 255}.${(tick * 31) % 255}`,
  };
}

function buildLiveNotification(
  template: (typeof liveActivityTemplates)[number],
  tick: number,
): NotificationCenterItem {
  return {
    id: createClientId(`NTF-LIVE-${tick}`),
    title: template.title,
    message: template.message,
    time: formatTimestamp(),
    read: false,
    category: template.category,
    href: template.category === "Security" || template.category === "Incident" ? "/dashboard/activity-logs" : "/dashboard/reports",
    actionLabel: template.category === "Security" || template.category === "Incident" ? "Review audit event" : "Open workspace",
  };
}

function updateLiveTimeline(
  timeline: ActivityTimelinePoint[],
  activity: ActivityFeedItem,
): ActivityTimelinePoint[] {
  const tone: ActivityTimelinePoint["tone"] =
    activity.severity === "Critical" ? "critical" : activity.severity === "Warning" ? "warning" : "info";

  return [
    {
      id: createClientId(`TL-${activity.id}`),
      label: activity.action,
      timestamp: activity.timestamp,
      value: activity.resource,
      tone,
    },
    ...timeline,
  ].slice(0, 5);
}

function updateLiveTransactionMonitor(
  monitor: TransactionMonitorRecord[],
  tick: number,
): TransactionMonitorRecord[] {
  const states: TransactionMonitorRecord["state"][] = ["Healthy", "Monitoring", "Guarded"];

  return monitor.map((item, index) => ({
    ...item,
    state: states[(tick + index) % states.length],
    detail:
      index % 2 === 0
        ? "Live transaction queue reconciled with audit-safe rollback guards."
        : "Operational integrity verified across report, notification, and activity writes.",
  }));
}

function SectionCard({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "group relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,30,0.9),rgba(10,18,36,0.86))] p-4 shadow-lg shadow-black/10 transition-colors duration-200 hover:border-cyan-400/24 [content-visibility:auto] [contain-intrinsic-size:320px]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="type-heading text-base text-white">{title}</h3>
        <p className="type-body mt-1 text-xs leading-5 text-white/48">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ChartSkeleton({
  heightClassName = "h-[320px] min-h-[320px]",
}: {
  heightClassName?: string;
}) {
  return (
    <div className={cn("w-full min-w-0", heightClassName)}>
      <Skeleton className="synapse-skeleton-shimmer h-full w-full rounded-[1.4rem] border border-white/8 bg-white/[0.04]" />
    </div>
  );
}

const AnalyticsOverviewChart = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-charts").then(
      (module) => module.AnalyticsOverviewChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

const DatabaseVisualizationChart = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-charts").then(
      (module) => module.DatabaseVisualizationChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton heightClassName="h-[260px] min-h-[260px]" />,
  },
);

const SystemLoadChart = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-charts").then(
      (module) => module.SystemLoadChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

export function DashboardPage({
  role,
  section,
  snapshot: initialSnapshot,
  userName,
}: {
  role: UserRole;
  section: DashboardSection;
  snapshot: DashboardSnapshot;
  userName: string;
}) {
  const { pushToast } = useToast();
  const {
    notifications: interactiveNotifications,
    openNotification,
    prependNotification,
    markAllNotificationsRead,
  } = useNotificationCenter();
  const meta = getDashboardSectionMeta(role, section);
  const Icon = sectionIcons[section];
  const [dashboardSnapshot, setDashboardSnapshot] = useState(initialSnapshot);
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [adminWorkspaceTab, setAdminWorkspaceTab] = useState<AdminWorkspaceTab>("overview");
  const [profileName, setProfileName] = useState(userName);
  const [profileAvatar, setProfileAvatar] = useState("");
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisibilityResetKey, setPasswordVisibilityResetKey] = useState(0);
  const [settingsState, setSettingsState] = useState<DashboardPreferencesState>(() => {
    if (typeof window === "undefined") {
      return defaultSettingsState;
    }

    const raw = window.localStorage.getItem("synapseos.dashboard.preferences");

    if (!raw) {
      return defaultSettingsState;
    }

    try {
      return {
        ...defaultSettingsState,
        ...(JSON.parse(raw) as Partial<DashboardPreferencesState>),
      };
    } catch {
      window.localStorage.removeItem("synapseos.dashboard.preferences");
      return defaultSettingsState;
    }
  });
  const [reportForm, setReportForm] = useState<ReportFormState>(() =>
    getDefaultReportForm(userName),
  );
  const [reportErrors, setReportErrors] = useState<ReportFormErrors>({});
  const [reportLifecycleFilter, setReportLifecycleFilter] = useState<ReportLifecycleFilter>("ACTIVE");
  const [reportQuery, setReportQuery] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatusFilter>("ALL");
  const [reportOwnerFilter, setReportOwnerFilter] = useState("ALL");
  const [reportSort, setReportSort] = useState<ReportSortOption>("newest");
  const [reportPage, setReportPage] = useState(1);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportRecord | null>(null);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [reportDeleteCandidate, setReportDeleteCandidate] = useState<ReportRecord | null>(null);
  const [creatingReport, setCreatingReport] = useState(false);
  const [reportTransactionProgress, setReportTransactionProgress] = useState(0);
  const [reportTransactionStage, setReportTransactionStage] =
    useState<ReportTransactionStage>("idle");
  const [assigningRoles, setAssigningRoles] = useState<Record<string, boolean>>({});
  const [deletingUsers, setDeletingUsers] = useState<Record<string, boolean>>({});
  const [savingUser, setSavingUser] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDirectoryRecord | null>(null);
  const [userForm, setUserForm] = useState<AdminUserFormState>(defaultAdminUserForm);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [reportActionState, setReportActionState] = useState<Record<string, Partial<Record<ReportActionKey, boolean>>>>({});
  const [syncingActivities, setSyncingActivities] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [activitySeverityFilter, setActivitySeverityFilter] = useState<ActivitySeverityFilter>("ALL");
  const [activityPage, setActivityPage] = useState(1);
  const [liveActivities, setLiveActivities] = useState(() => initialSnapshot.activities);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [liveStatusTick, setLiveStatusTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(formatTimestamp());
  const [selectedUserSummary, setSelectedUserSummary] = useState<null | {
    userName: string;
    email: string;
    notifications: number;
    activities: number;
    reports: number;
  }>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(userQuery);

  const snapshot = dashboardSnapshot;
  const chartSeries = useMemo(() => snapshot.chartSeries, [snapshot.chartSeries]);
  const liveStatus = useMemo(() => {
    const criticalAlerts = liveAlerts.filter((alert) => alert.severity === "Critical").length;
    const warningAlerts = liveAlerts.filter((alert) => alert.severity === "Warning").length;

    if (criticalAlerts) {
      return {
        label: "Anomaly watch",
        tone: "Critical" as const,
        detail: `${criticalAlerts} critical signal${criticalAlerts === 1 ? "" : "s"} under review`,
      };
    }

    if (warningAlerts || liveStatusTick % 5 === 0) {
      return {
        label: "Monitoring",
        tone: "Warning" as const,
        detail: "Live simulator is rotating enterprise telemetry",
      };
    }

    return {
      label: "System stable",
      tone: "Info" as const,
      detail: "Metrics, charts, alerts, and activity are updating in realtime",
    };
  }, [liveAlerts, liveStatusTick]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      const tick = Date.now();
      const template = pickLiveTemplate(liveActivityTemplates, Math.floor(tick / 4200));
      const activity = buildLiveActivity(template, tick);
      const notification = buildLiveNotification(template, tick);

      setDashboardSnapshot((current) => {
        const nextSystemMetrics = current.systemMetrics.map((metric) =>
          updateLiveSystemMetric(metric),
        );
        const nextChartSeries = updateLiveChartSeries(current.chartSeries, nextSystemMetrics);
        const latestPoint = nextChartSeries.at(-1);
        const anomalyScore = latestPoint
          ? clampMetric(((latestPoint.cpuUsage ?? 50) + (latestPoint.latency ?? 120) / 3) / 2, 8, 88)
          : 24;

        return {
          ...current,
          activities: [activity, ...current.activities].slice(0, 10),
          activityTimeline: updateLiveTimeline(current.activityTimeline, activity),
          chartSeries: nextChartSeries,
          insights: current.insights.map((insight, index) =>
            index === 0
              ? {
                  ...insight,
                  description:
                    anomalyScore > 52
                      ? "Live telemetry detected elevated latency pressure and queued a monitoring recommendation."
                      : "Live telemetry confirms stable operations across RBAC, reporting, and database monitoring.",
                  stat: anomalyScore > 52 ? `A${anomalyScore}` : "Stable",
                }
              : insight,
          ),
          kpis: current.kpis.map((kpi) => ({
            ...kpi,
            value:
              kpi.suffix === "%"
                ? Number(Math.min(99.99, Math.max(91, kpi.value + (Math.random() * 0.12 - 0.05))).toFixed(kpi.value > 99 ? 3 : 0))
                : clampMetric(kpi.value + (Math.random() * 8 - 3), Math.max(0, kpi.value - 18), kpi.value + 24),
            sparkline: [...kpi.sparkline.slice(-9), clampMetric(kpi.sparkline.at(-1) ?? kpi.value, 10, 100)],
          })),
          notifications:
            Math.floor(tick / 4200) % 2 === 0
              ? [notification, ...current.notifications].slice(0, 10)
              : current.notifications,
          queryAnalytics: current.queryAnalytics.map((item, index) => ({
            ...item,
            value: clampMetric(item.value + (Math.random() * 26 - 8), 8, 12000),
            change: `${index % 2 === 0 ? "+" : "-"}${Math.max(1, Math.round(Math.random() * 9))}% live`,
          })),
          systemMetrics: nextSystemMetrics,
          transactionMonitor: updateLiveTransactionMonitor(current.transactionMonitor, Math.floor(tick / 4200)),
        };
      });

      setLiveActivities((current) => [activity, ...current].slice(0, 24));
      setLiveStatusTick((current) => current + 1);
      setLastUpdatedAt(formatTimestamp());

      if (Math.floor(tick / 4200) % 2 === 0) {
        prependNotification(notification);
      }

      if (Math.floor(tick / 4200) % 3 === 0) {
        const alertTemplate = pickLiveTemplate(liveAlertTemplates, Math.floor(tick / 4200));
        setLiveAlerts((current) => [
          {
            ...alertTemplate,
            id: createClientId("ALERT"),
            timestamp: formatTimestamp(),
          },
          ...current,
        ].slice(0, 3));
      }
    }, 4200);

    return () => window.clearInterval(interval);
  }, [prependNotification]);

  const filteredUsers = useMemo(() => {
    return snapshot.users.filter((user) =>
      [user.name, user.email, user.department]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery.toLowerCase()) &&
      (userRoleFilter === "ALL" || user.role === userRoleFilter) &&
      (userStatusFilter === "ALL" || user.status === userStatusFilter),
    );
  }, [deferredQuery, snapshot.users, userRoleFilter, userStatusFilter]);
  const paginatedUsers = filteredUsers.slice((page - 1) * 4, page * 4);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / 4));
  const adminControlMetrics = useMemo(() => {
    const activeUsers = snapshot.users.filter((user) => user.status === "Active").length;
    const suspendedUsers = snapshot.users.filter((user) => user.status === "Suspended").length;
    const failedLogins = liveActivities.filter((activity) =>
      activity.action.toLowerCase().includes("login") &&
      (activity.action.toLowerCase().includes("fail") || activity.severity === "Critical"),
    ).length;
    const roleChanges = liveActivities.filter((activity) =>
      activity.action.toLowerCase().includes("role"),
    ).length;

    return {
      activeUsers,
      auditEvents: liveActivities.length,
      databaseHealth: snapshot.systemMetrics.length
        ? Math.max(
            0,
            Math.round(
              100 -
                snapshot.systemMetrics.reduce((total, metric) => total + Math.min(metric.current / Math.max(metric.threshold, 1), 1) * 14, 0) /
                  snapshot.systemMetrics.length,
            ),
          )
        : 98,
      failedLogins,
      reportsCreated: snapshot.reports.length,
      roleChanges,
      securityAlerts: failedLogins + suspendedUsers,
      suspendedUsers,
      transactionsProcessed: snapshot.queryAnalytics.reduce((total, item) => total + item.value, 0),
      uptime: 99.982,
    };
  }, [liveActivities, snapshot.queryAnalytics, snapshot.reports.length, snapshot.systemMetrics, snapshot.users]);

  const reportOwners = useMemo(
    () => Array.from(new Set(snapshot.reports.map((report) => report.owner))).sort((a, b) => a.localeCompare(b)),
    [snapshot.reports],
  );

  const filteredReports = useMemo(() => {
    const scoped = snapshot.reports.filter((report) =>
      [report.title, report.owner, report.id, report.type]
        .join(" ")
        .toLowerCase()
        .includes(reportQuery.toLowerCase()) &&
      (reportLifecycleFilter === "ALL"
        ? true
        : reportLifecycleFilter === "ARCHIVED"
          ? Boolean(report.isArchived)
          : !report.isArchived) &&
      (reportStatusFilter === "ALL" || report.status === reportStatusFilter) &&
      (reportOwnerFilter === "ALL" || report.owner === reportOwnerFilter),
    );

    return scoped.sort((left, right) => {
      if (reportSort === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      if (reportSort === "status") {
        return left.status.localeCompare(right.status);
      }

      if (reportSort === "owner") {
        return left.owner.localeCompare(right.owner);
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [reportLifecycleFilter, reportOwnerFilter, reportQuery, reportSort, reportStatusFilter, snapshot.reports]);
  const paginatedReports = filteredReports.slice((reportPage - 1) * 5, reportPage * 5);
  const reportPageCount = Math.max(1, Math.ceil(filteredReports.length / 5));

  const filteredActivities = useMemo(() => {
    return liveActivities.filter((activity) =>
      [activity.actor, activity.action, activity.resource, activity.ipAddress]
        .join(" ")
        .toLowerCase()
        .includes(activityQuery.toLowerCase()) &&
      (activitySeverityFilter === "ALL" || activity.severity === activitySeverityFilter),
    );
  }, [activityQuery, activitySeverityFilter, liveActivities]);

  const paginatedActivities = filteredActivities.slice((activityPage - 1) * 4, activityPage * 4);
  const activityPageCount = Math.max(1, Math.ceil(filteredActivities.length / 4));

  const roleLabel =
    role === "ADMIN" ? "Administrator privileges validated." : role === "MANAGER" ? "Manager scope enforced." : "Personal access scope enforced.";

  const analyticsDescription =
    role === "ADMIN"
      ? "Global usage, traffic, and system patterns across the enterprise."
      : role === "MANAGER"
        ? "Department productivity, team activity, and reporting throughput."
        : "Your own focus, report activity, and notification cadence.";
  const visibleNotifications = interactiveNotifications.length
    ? interactiveNotifications
    : snapshot.notifications;
  const unreadNotifications = visibleNotifications.filter((item) => !item.read);
  const displayName = profileName.trim() || userName;
  const canManageOwnReport = (report: ReportRecord) =>
    role === "ADMIN" ||
    (role === "MANAGER"
      ? report.ownerScope !== "Global workspace"
      : report.owner === displayName || report.owner === "Assigned to you");
  const canDeleteReport = (report: ReportRecord) =>
    role === "ADMIN" ||
    (role === "MANAGER"
      ? report.ownerScope !== "Global workspace" && report.owner !== "Ariana Kent"
      : report.owner === displayName || report.owner === "Assigned to you");
  const avatarPreviewLabel =
    profileName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || snapshot.profile.avatarFallback;
  const transactionStageLabel =
    reportTransactionStage === "validating"
      ? "Validating payload"
      : reportTransactionStage === "committing"
        ? "Opening DB transaction"
        : reportTransactionStage === "persisting"
          ? "Persisting report artifacts"
          : reportTransactionStage === "completed"
            ? "Transaction committed"
            : "Ready to queue report transaction";

  function updateReportField<Key extends keyof ReportFormState>(
    field: Key,
    value: ReportFormState[Key],
  ) {
    setReportForm((current) => ({
      ...current,
      [field]: value,
    }));
    setReportErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function resetReportComposer(nextOwner = displayName) {
    setReportForm(getDefaultReportForm(nextOwner));
    setReportErrors({});
    setReportTransactionProgress(0);
    setReportTransactionStage("idle");
  }

  function openReportComposer() {
    setEditingReport(null);
    resetReportComposer(displayName);
    setReportModalOpen(true);
  }

  function openReportEditor(report: ReportRecord) {
    setEditingReport(report);
    setReportForm({
      title: report.title,
      reportType: report.type,
      owner: report.owner,
      requestedAt: new Date().toISOString(),
      exportFormat: report.exportFormat,
      status: report.status === "Archived" ? report.lastActiveStatus ?? "Completed" : report.status,
    });
    setReportErrors({});
    setReportTransactionProgress(0);
    setReportTransactionStage("idle");
    setReportModalOpen(true);
  }

  function closeReportComposer(open: boolean) {
    if (creatingReport) {
      return;
    }

    setReportModalOpen(open);

    if (!open) {
      setEditingReport(null);
      resetReportComposer(displayName);
    }
  }

  function mapPersistedUserToDirectoryRecord(user: {
    createdAt?: string | Date;
    department?: { name?: string | null } | null;
    email: string;
    id: string;
    name: string;
    role?: { name?: string | null } | null;
    status?: string | null;
    updatedAt?: string | Date;
  }): UserDirectoryRecord {
    const status =
      user.status === "SUSPENDED"
        ? "Suspended"
        : user.status === "INVITED"
          ? "Provisioning"
          : "Active";
    const lastSeenDate = user.updatedAt ?? user.createdAt;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role?.name as UserRole | undefined) ?? "USER",
      department: user.department?.name ?? "General",
      status,
      lastSeen: lastSeenDate ? "Just now" : "Pending",
      avatar:
        user.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase() || "SO",
    };
  }

  function openCreateUserModal() {
    setEditingUser(null);
    setUserForm(defaultAdminUserForm);
    setUserModalOpen(true);
  }

  function openEditUserModal(user: UserDirectoryRecord) {
    setEditingUser(user);
    setUserForm({
      department: user.department === "Unassigned" ? "General" : user.department,
      email: user.email,
      name: user.name,
      password: "ChangeMe123",
      role: user.role,
      status:
        user.status === "Suspended"
          ? "SUSPENDED"
          : user.status === "Provisioning"
            ? "INVITED"
            : "ACTIVE",
    });
    setUserModalOpen(true);
  }

  async function handleSaveUser(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (savingUser) {
      return;
    }

    setSavingUser(true);

    try {
      const endpoint = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const response = await fetch(endpoint, {
        method: editingUser ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userForm),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: editingUser ? "User update failed" : "User creation failed",
          description: payload?.error ?? "Unable to persist the user lifecycle change.",
          tone: "error",
        });
        return;
      }

      const record = mapPersistedUserToDirectoryRecord(payload.user);
      setDashboardSnapshot((current) => ({
        ...current,
        users: editingUser
          ? current.users.map((user) => (user.id === record.id ? record : user))
          : [record, ...current.users],
      }));
      setLastUpdatedAt(formatTimestamp());
      setUserModalOpen(false);
      setEditingUser(null);
      setUserForm(defaultAdminUserForm);
      pushToast({
        title: editingUser ? "User updated" : "User created",
        description: `${record.name} is now ${record.status.toLowerCase()} with ${record.role} access.`,
        tone: "success",
      });
      void refreshActivityLogs({ silent: true });
    } finally {
      setSavingUser(false);
    }
  }

  async function handleToggleUserStatus(user: UserDirectoryRecord) {
    const nextStatus = user.status === "Suspended" ? "ACTIVE" : "SUSPENDED";
    const previousUser = user;

    setDashboardSnapshot((current) => ({
      ...current,
      users: current.users.map((entry) =>
        entry.id === user.id
          ? {
              ...entry,
              status: nextStatus === "SUSPENDED" ? "Suspended" : "Active",
              lastSeen: "Just now",
            }
          : entry,
      ),
    }));

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setDashboardSnapshot((current) => ({
          ...current,
          users: current.users.map((entry) =>
            entry.id === previousUser.id ? previousUser : entry,
          ),
        }));
        pushToast({
          title: "Status update failed",
          description: payload?.error ?? "Unable to update the account status.",
          tone: "error",
        });
        return;
      }

      const record = mapPersistedUserToDirectoryRecord(payload.user);
      setDashboardSnapshot((current) => ({
        ...current,
        users: current.users.map((entry) =>
          entry.id === record.id ? record : entry,
        ),
      }));
      setLastUpdatedAt(formatTimestamp());
      pushToast({
        title: nextStatus === "SUSPENDED" ? "User suspended" : "User reactivated",
        description: `${record.name} is now ${record.status.toLowerCase()}.`,
        tone: "success",
      });
      void refreshActivityLogs({ silent: true });
    } catch (error) {
      setDashboardSnapshot((current) => ({
        ...current,
        users: current.users.map((entry) =>
          entry.id === previousUser.id ? previousUser : entry,
        ),
      }));
      pushToast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unable to update the account status.",
        tone: "error",
      });
    }
  }

  function setReportActionLoading(
    reportId: string,
    action: ReportActionKey,
    active: boolean,
  ) {
    setReportActionState((current) => ({
      ...current,
      [reportId]: {
        ...current[reportId],
        [action]: active,
      },
    }));
  }

  function updateReportInSnapshot(
    reportId: string,
    updater: (report: ReportRecord) => ReportRecord,
  ) {
    setDashboardSnapshot((current) => ({
      ...current,
      reports: current.reports.map((report) =>
        report.id === reportId ? updater(report) : report,
      ),
    }));
    setSelectedReport((current) => (current && current.id === reportId ? updater(current) : current));
  }

  function logReportInteraction(
    report: ReportRecord,
    action: string,
    detail: string,
    notificationTitle: string,
  ) {
    const isWarningAction =
      action.toLowerCase().includes("archiv") ||
      action.toLowerCase().includes("delete") ||
      action.toLowerCase().includes("restore");
    const nextActivity: ActivityFeedItem = {
      id: createClientId(`ACT-${report.id}`),
      actor: displayName,
      action,
      resource: report.title,
      timestamp: "Just now",
      severity: isWarningAction ? "Warning" : "Info",
      ipAddress: "127.0.0.1",
    };
    const nextNotification = {
      id: createClientId(`NOT-${report.id}`),
      title: notificationTitle,
      message: detail,
      time: "Just now",
      read: false,
      category: "Workflow" as const,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Open reports",
    };
    const timelineTone: "info" | "warning" =
      isWarningAction ? "warning" : "info";

    setLiveActivities((current) => [nextActivity, ...current].slice(0, 24));
    prependNotification(nextNotification);
    setDashboardSnapshot((current) => ({
      ...current,
      activities: [nextActivity, ...current.activities].slice(0, 8),
      notifications: [nextNotification, ...current.notifications].slice(0, 8),
      activityTimeline: [
        {
          id: createClientId(`TL-${report.id}`),
          label: action,
          value: detail,
          timestamp: "Just now",
          tone: timelineTone,
        },
        ...current.activityTimeline,
      ].slice(0, 4),
    }));
    setLastUpdatedAt(formatTimestamp());
  }

  function openReportDetail(report: ReportRecord) {
    setSelectedReport(report);
    setReportViewerOpen(true);
    updateReportInSnapshot(report.id, (current) => ({
      ...current,
      activityHistory: [
          {
            id: `${current.id}-viewed-${Date.now()}`,
            action: "report.viewed",
            actor: displayName,
            timestamp: "Just now",
            detail: "The report was opened in the enterprise viewer.",
        },
        ...current.activityHistory,
      ].slice(0, 6),
    }));
    logReportInteraction(
      report,
      "report.viewed",
      `${report.title} was opened from the reports workspace.`,
      "Report opened",
    );
    void fetch(`/api/account/reports/${report.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "view" }),
    }).catch(() => null);
  }

  function buildRichReportRecord(report: Partial<ReportRecord> & Pick<ReportRecord, "id" | "title" | "type" | "owner" | "status" | "createdAt" | "generatedAt" | "exportFormat">): ReportRecord {
    const statusMetrics =
      report.metrics ??
      buildReportMetrics(
        report.status === "Archived"
          ? "Completed"
          : report.status,
      );
    return {
      archivedAt: report.archivedAt ?? null,
      deletedAt: report.deletedAt ?? null,
      isArchived: report.isArchived ?? report.status === "Archived",
      lastActiveStatus:
        report.lastActiveStatus ??
        (report.status === "Archived" ? "Completed" : report.status),
      transactionId: report.transactionId ?? `TXN-${report.id}`,
      ownerScope:
        report.ownerScope ??
        (role === "ADMIN"
          ? "Global workspace"
          : role === "MANAGER"
            ? "Department workspace"
            : "Personal workspace"),
      analytics:
        report.analytics ?? {
          rowsAnalyzed: 1800 + report.title.length * 48,
          executionDurationMs: report.status === "Completed" ? 942 : report.status === "Failed" ? 1760 : 1260,
          transactionCount: report.status === "Archived" ? 10 : 14,
          dbLoad: report.status === "Failed" ? "14.1 GB" : "8.9 GB",
          securityChecks: report.status === "Failed" ? "4 of 5 passed" : "5 of 5 passed",
          anomalyScore: report.status === "Failed" ? 74 : report.status === "Archived" ? 14 : 29,
        },
      preview:
        report.preview ?? {
          highlights: [
            `${report.type} prepared for ${report.exportFormat} delivery`,
            `${report.status} state reflected across reporting analytics`,
            `${report.owner} remains the current accountable owner`,
          ],
          ...(report.exportFormat === "CSV"
            ? {
                columns: ["Segment", "Rows", "Delta", "Owner"],
                rows: [
                  ["North America", "1284", "+12.4%", report.owner],
                  ["EMEA", "942", "+8.1%", report.owner],
                  ["APAC", "1106", "+10.2%", report.owner],
                ],
              }
            : report.exportFormat === "JSON"
              ? {
                  json: {
                    reportType: report.type,
                    owner: report.owner,
                    status: report.status,
                    controls: {
                      auditReady: true,
                      encrypted: true,
                    },
                  },
                }
              : {}),
        },
      activityHistory:
        report.activityHistory ?? [
          {
            id: `${report.id}-created`,
            action: "Report created",
            actor: report.owner,
            timestamp: "Just now",
            detail: "The report was created and registered in the reporting workflow.",
          },
        ],
      metrics: statusMetrics,
      metadata:
        report.metadata ?? {
          summary: buildReportSummary(report.type, report.exportFormat),
          metrics: statusMetrics,
        },
      ...report,
    };
  }

  function applySuccessfulReportEffects(
    current: DashboardSnapshot,
    report: ReportRecord,
  ) {
    return {
      ...current,
      reports: [report, ...current.reports.filter((item) => item.id !== report.id)].slice(0, 8),
      kpis: current.kpis.map((kpi) => {
        if (kpi.label.includes("Reports")) {
          return {
            ...kpi,
            value: kpi.value + 1,
            detail: "Updated moments ago from the reporting transaction queue",
          };
        }

        if (kpi.label.includes("Database Operations")) {
          return {
            ...kpi,
            value: kpi.value + 1240,
            detail: "Realtime write operations after the latest reporting commit",
          };
        }

        if (kpi.label.includes("Notifications")) {
          return {
            ...kpi,
            value: kpi.value + 1,
            detail: "Unread items in your personal notification center",
          };
        }

        if (kpi.label.includes("Transactions/sec")) {
          return {
            ...kpi,
            value: kpi.value + 12,
            detail: "Sustained throughput after the last committed transaction",
          };
        }

        return kpi;
      }),
      chartSeries: current.chartSeries.map((point, index, collection) =>
        index === collection.length - 1
          ? {
              ...point,
              reports: point.reports + 1,
              activities: point.activities + 1,
            }
          : point,
      ),
      queryAnalytics: current.queryAnalytics.map((item) => {
        if (item.label === "Report writes") {
          return {
            ...item,
            value: item.value + 1,
            change: "+18.4%",
          };
        }

        if (item.label === "Audit inserts") {
          return {
            ...item,
            value: item.value + 1,
            change: "+8.6%",
          };
        }

        if (item.label === "Notification fanout") {
          return {
            ...item,
            value: item.value + 1,
            change: "+5.8%",
          };
        }

        return item;
      }),
      activityTimeline: [
        {
          id: `TL-${report.id}`,
          label: "Report transaction",
          value: `${report.title} committed and queued for ${report.exportFormat} export`,
          timestamp: "Just now",
          tone: "info" as const,
        },
        ...current.activityTimeline,
      ].slice(0, 4),
      transactionMonitor: current.transactionMonitor.map((item) =>
        item.label === "Report generation" || item.label === "Report pipeline"
          ? {
              ...item,
              state: "Healthy" as const,
              detail: `Last transaction ${report.transactionId ?? report.id} committed successfully and synchronized downstream notifications.`,
            }
          : item,
      ),
    };
  }

  async function handleProfileSave() {
    startTransition(async () => {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName,
          avatar: profileAvatar,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Profile update failed",
          description: payload?.error ?? "Unable to save profile changes right now.",
          tone: "error",
        });
        return;
      }

      setDashboardSnapshot((current) => ({
        ...current,
        profile: {
          ...current.profile,
          avatarFallback:
            (payload?.user?.name ?? profileName)
              .split(" ")
              .slice(0, 2)
              .map((part: string) => part[0])
              .join("")
              .toUpperCase() || current.profile.avatarFallback,
        },
      }));

      pushToast({
        title: "Profile updated",
        description: "Your account settings were saved successfully.",
        tone: "success",
      });
      setLastUpdatedAt(formatTimestamp());
    });
  }

  async function handlePasswordUpdate() {
    if (
      !securityForm.currentPassword ||
      !securityForm.newPassword ||
      !securityForm.confirmPassword
    ) {
      pushToast({
        title: "Complete the password form",
        description: "Fill in your current password and the new password fields.",
        tone: "error",
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/account/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(securityForm),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Password update failed",
          description: payload?.error ?? "Your password could not be rotated right now.",
          tone: "error",
        });
        return;
      }

      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordVisibilityResetKey((current) => current + 1);
      setLastUpdatedAt(formatTimestamp());
      pushToast({
        title: "Password updated",
        description: "Your account password has been rotated successfully.",
        tone: "success",
      });
    });
  }

  function handleSavePreferences() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "synapseos.dashboard.preferences",
        JSON.stringify(settingsState),
      );
    }

    setLastUpdatedAt(formatTimestamp());
    pushToast({
      title: "Workspace preferences saved",
      description: "Theme, notification, and density preferences were updated for this browser.",
      tone: "success",
    });
  }

  async function handleCopyInviteLink() {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/register`
        : "/register";

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }

      pushToast({
        title: "Invite link ready",
        description: "The secure registration link has been copied for operator onboarding.",
        tone: "success",
      });
    } catch {
      pushToast({
        title: "Invite link available",
        description: inviteUrl,
        tone: "info",
      });
    }
  }

  async function handleCopyUserEmail(email: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(email);
      }

      pushToast({
        title: "Email copied",
        description: `${email} is ready to paste into your access workflow.`,
        tone: "success",
      });
    } catch {
      pushToast({
        title: "Copy failed",
        description: "The email address could not be copied from this environment.",
        tone: "error",
      });
    }
  }

  async function handleCreateReport(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (creatingReport) {
      return;
    }

    const parsed = createReportSchema.safeParse({
      ...reportForm,
      title: reportForm.title.trim(),
      owner: reportForm.owner.trim(),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setReportErrors({
        title: fieldErrors.title?.[0],
        reportType: fieldErrors.reportType?.[0],
        owner: fieldErrors.owner?.[0],
        requestedAt: fieldErrors.requestedAt?.[0],
        exportFormat: fieldErrors.exportFormat?.[0],
        status: fieldErrors.status?.[0],
      });
      pushToast({
        title: "Complete the report form",
        description:
          Object.values(fieldErrors).flat().find(Boolean) ??
          "Review the report fields before starting the transaction.",
        tone: "error",
      });
      return;
    }

    const submission = parsed.data;

    if (editingReport) {
      setCreatingReport(true);
      setReportErrors({});
      setReportTransactionStage("persisting");
      setReportTransactionProgress(72);

      const previousReport = editingReport;
      const optimisticReport = buildRichReportRecord({
        ...previousReport,
        title: submission.title,
        type: submission.reportType,
        owner: submission.owner,
        status: submission.status ?? previousReport.status,
        exportFormat: submission.exportFormat,
        metadata: {
          summary: buildReportSummary(submission.reportType, submission.exportFormat),
          metrics: buildReportMetrics(submission.status ?? previousReport.status),
        },
        metrics: buildReportMetrics(submission.status ?? previousReport.status),
        activityHistory: [
          {
            id: `${previousReport.id}-updated-${Date.now()}`,
            action: "report.updated",
            actor: displayName,
            timestamp: "Just now",
            detail: "Report metadata was edited and persisted through the workflow API.",
          },
          ...previousReport.activityHistory,
        ].slice(0, 6),
      });

      updateReportInSnapshot(previousReport.id, () => optimisticReport);

      try {
        const response = await fetch(`/api/account/reports/${previousReport.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            payload: submission,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          updateReportInSnapshot(previousReport.id, () => previousReport);
          pushToast({
            title: "Report update failed",
            description: payload?.error ?? "Unable to persist report edits.",
            tone: "error",
          });
          return;
        }

        const persistedReport = buildRichReportRecord(payload.report as ReportRecord);
        updateReportInSnapshot(previousReport.id, () => persistedReport);
        logReportInteraction(
          persistedReport,
          "report.updated",
          `${persistedReport.title} metadata was updated and persisted.`,
          "Report updated",
        );
        setReportModalOpen(false);
        setEditingReport(null);
        resetReportComposer(displayName);
        setReportTransactionProgress(100);
        pushToast({
          title: "Report updated",
          description: `${persistedReport.title} was saved to the database.`,
          tone: "success",
        });
      } catch (error) {
        updateReportInSnapshot(previousReport.id, () => previousReport);
        pushToast({
          title: "Report update failed",
          description: error instanceof Error ? error.message : "Unable to persist report edits.",
          tone: "error",
        });
      } finally {
        setCreatingReport(false);
        setReportTransactionStage("idle");
        setReportTransactionProgress(0);
      }

      return;
    }

    const optimisticId = `TEMP-${Date.now()}`;
    const optimisticReport = buildRichReportRecord({
      id: optimisticId,
      title: submission.title,
      type: submission.reportType,
      owner: submission.owner,
      status: submission.status === "Draft" ? "Draft" : "Processing",
      generatedAt: "Now",
      createdAt: submission.requestedAt,
      exportFormat: submission.exportFormat,
      transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
      ownerScope:
        role === "ADMIN"
          ? "Global workspace"
          : role === "MANAGER"
            ? "Department workspace"
            : "Personal workspace",
      metrics: buildReportMetrics(submission.status === "Draft" ? "Draft" : "Processing"),
      metadata: {
        summary: buildReportSummary(submission.reportType, submission.exportFormat),
        metrics: buildReportMetrics(submission.status === "Draft" ? "Draft" : "Processing"),
      },
    });

    setCreatingReport(true);
    setReportErrors({});
    setReportTransactionStage("validating");
    setReportTransactionProgress(18);
    setDashboardSnapshot((current) => ({
      ...current,
      reports: [optimisticReport, ...current.reports].slice(0, 8),
    }));

    const progressInterval = window.setInterval(() => {
      setReportTransactionProgress((current) =>
        current >= 88 ? current : current + Math.max(3, Math.round((92 - current) / 3)),
      );
    }, 180);

    try {
      setReportTransactionStage("committing");
      const reportEndpoint =
        role === "USER" ? "/api/account/reports" : "/api/admin/reports";

      const response = await fetch(reportEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (payload?.fieldErrors) {
          setReportErrors({
            title: payload.fieldErrors.title?.[0],
            reportType: payload.fieldErrors.reportType?.[0],
            owner: payload.fieldErrors.owner?.[0],
            requestedAt: payload.fieldErrors.requestedAt?.[0],
            exportFormat: payload.fieldErrors.exportFormat?.[0],
            status: payload.fieldErrors.status?.[0],
          });
        }

        setDashboardSnapshot((current) => ({
          ...current,
          reports: current.reports.filter((report) => report.id !== optimisticId),
        }));
        setReportTransactionStage("idle");
        setReportTransactionProgress(0);
        pushToast({
          title: "Report transaction failed",
          description: payload?.error ?? "Failed to persist report.",
          tone: "error",
        });
        return;
      }

      setReportTransactionStage("persisting");
      setReportTransactionProgress(96);

      const createdReport = buildRichReportRecord(payload.report as ReportRecord);
      const createdNotification = payload.notification
        ? {
            id: payload.notification.id,
            title: payload.notification.title,
            message: payload.notification.message,
            time: "Just now",
            read: false,
            category: "Workflow" as const,
            href: "/dashboard/reports#reports-workspace",
            actionLabel: "Open reports",
          }
        : {
            id: `NOT-${createdReport.id}`,
            title: "Report pipeline started",
            message: `"${createdReport.title}" has entered the reporting pipeline.`,
            time: "Just now",
            read: false,
            category: "Workflow" as const,
            href: "/dashboard/reports#reports-workspace",
            actionLabel: "Open reports",
          };
      const createdActivity: ActivityFeedItem = payload.activityLog
        ? {
            id: payload.activityLog.id,
            actor: submission.owner,
            action: "report.created",
            resource: createdReport.title,
            timestamp: "Just now",
            severity: "Info",
            ipAddress: payload.activityLog.ipAddress ?? "127.0.0.1",
          }
        : {
            id: `LOG-${createdReport.id}`,
            actor: submission.owner,
            action: "report.created",
            resource: createdReport.title,
            timestamp: "Just now",
            severity: "Info",
            ipAddress: "127.0.0.1",
          };

      setDashboardSnapshot((current) => {
        const nextState = applySuccessfulReportEffects(
          {
            ...current,
            reports: current.reports.filter((report) => report.id !== optimisticId),
          },
          createdReport,
        );
        return {
          ...nextState,
          activities: [createdActivity, ...nextState.activities.filter((item) => item.id !== createdActivity.id)].slice(0, 8),
          notifications: [createdNotification, ...nextState.notifications.filter((item) => item.id !== createdNotification.id)].slice(0, 8),
        };
      });
      setLiveActivities((current) => [createdActivity, ...current].slice(0, 24));
      prependNotification(createdNotification);
      setLastUpdatedAt(formatTimestamp());
      setReportTransactionStage("completed");
      setReportTransactionProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 180));

      setReportModalOpen(false);
      resetReportComposer(displayName);
      pushToast({
        title: "Report queued successfully",
        description: `${createdReport.title} is now available in the reports workspace as a ${createdReport.exportFormat} export.`,
        tone: "success",
      });
    } catch (error) {
      setDashboardSnapshot((current) => ({
        ...current,
        reports: current.reports.filter((report) => report.id !== optimisticId),
      }));
      setReportTransactionStage("idle");
      setReportTransactionProgress(0);
      pushToast({
        title: "Report transaction failed",
        description:
          error instanceof Error ? error.message : "Transaction timed out before the report could be committed.",
        tone: "error",
      });
    } finally {
      window.clearInterval(progressInterval);
      setCreatingReport(false);
    }
  }

  async function handleProcessNotifications() {
    startTransition(async () => {
      const response = await fetch("/api/admin/notifications/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 10 }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Notification processing failed",
          description: payload?.error ?? "Unable to process the queue.",
          tone: "error",
        });
        return;
      }

      setDashboardSnapshot((current) => ({
        ...current,
        notifications: current.notifications.map((item) => ({
          ...item,
          read: true,
        })),
      }));
      await markAllNotificationsRead({ persist: false });
      setLastUpdatedAt(formatTimestamp());
      pushToast({
        title: "Queue processed",
        description: `${payload?.processed?.length ?? 0} notifications were advanced through the DBMS workflow.`,
        tone: "success",
      });
    });
  }

  async function handleExportReports(targetReport?: ReportRecord) {
    const exportKey = targetReport?.id ?? "all";
    setExportingReportId(exportKey);

    try {
      if (targetReport) {
        await exportReport(targetReport);
        await fetch(`/api/account/reports/${targetReport.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "export" }),
        }).catch(() => null);
        updateReportInSnapshot(targetReport.id, (current) => ({
          ...current,
          activityHistory: [
            {
              id: `${current.id}-exported-${Date.now()}`,
              action: "report.exported",
              actor: displayName,
              timestamp: "Just now",
              detail: `${current.exportFormat} artifact generated successfully.`,
            },
            ...current.activityHistory,
          ].slice(0, 6),
        }));
        logReportInteraction(
          targetReport,
          "report.exported",
          `${targetReport.title} was exported as ${targetReport.exportFormat}.`,
          "Report exported",
        );
        pushToast({
          title: "Report exported",
          description: `${targetReport.title} downloaded as ${targetReport.exportFormat}.`,
          tone: "success",
        });
        return;
      }

      await generateJsonReport(filteredReports);
      pushToast({
        title: "Manifest exported",
        description: `${filteredReports.length} reports were exported as a JSON manifest.`,
        tone: "success",
      });
    } catch (error) {
      pushToast({
        title: "Export failed",
        description:
          error instanceof Error
            ? error.message
            : "The requested report could not be generated.",
        tone: "error",
      });
    } finally {
      setExportingReportId(null);
    }
  }

  async function handleExportAuditLogs() {
    const exportedAt = new Date().toISOString();
    const auditPayload = {
      exportedAt,
      exportedBy: displayName,
      scope: role,
      summary: {
        auditEvents: adminControlMetrics.auditEvents,
        securityAlerts: adminControlMetrics.securityAlerts,
        roleChanges: adminControlMetrics.roleChanges,
      },
      events: liveActivities.map((activity) => ({
        actor: activity.actor,
        action: activity.action,
        entity: activity.resource,
        ipAddress: activity.ipAddress,
        severity: activity.severity,
        timestamp: activity.timestamp,
      })),
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `synapseos-audit-log-${exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);

    pushToast({
      title: "Audit logs exported",
      description: `${auditPayload.events.length} security and activity events were exported.`,
      tone: "success",
    });
  }

  async function handleArchiveReport(report: ReportRecord) {
    if (report.isArchived) {
      return;
    }

    setReportActionLoading(report.id, "archive", true);

    try {
      const response = await fetch(`/api/account/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "archive" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Archive failed",
          description: payload?.error ?? "Unable to archive this report right now.",
          tone: "error",
        });
        return;
      }

      updateReportInSnapshot(report.id, (current) =>
        buildRichReportRecord({
          ...current,
          ...(payload?.report ?? {}),
          archivedAt:
            payload?.report?.archivedAt ??
            payload?.report?.archivedAt?.toString?.() ??
            new Date().toISOString(),
          deletedAt: payload?.report?.deletedAt ?? current.deletedAt ?? null,
          isArchived: true,
          lastActiveStatus:
            current.status === "Archived"
              ? current.lastActiveStatus ?? "Completed"
              : current.status,
          status: "Archived",
          activityHistory: [
            {
              id: `${current.id}-archived-${Date.now()}`,
              action: "report.archived",
              actor: displayName,
              timestamp: "Just now",
              detail: "The report was archived from the reporting workspace.",
            },
            ...current.activityHistory,
          ].slice(0, 6),
        }),
      );
      logReportInteraction(
        report,
        "report.archived",
        `${report.title} was archived and preserved for audit playback.`,
        "Report archived",
      );
      pushToast({
        title: "Report archived",
        description: `${report.title} is now stored as a historical artifact.`,
        tone: "success",
      });
    } finally {
      setReportActionLoading(report.id, "archive", false);
    }
  }

  async function handleRestoreReport(report: ReportRecord) {
    setReportActionLoading(report.id, "restore", true);

    try {
      const response = await fetch(`/api/account/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "restore" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Restore failed",
          description: payload?.error ?? "Unable to restore this report right now.",
          tone: "error",
        });
        return;
      }

      updateReportInSnapshot(report.id, (current) =>
        buildRichReportRecord({
          ...current,
          ...(payload?.report ?? {}),
          archivedAt: null,
          deletedAt: null,
          isArchived: false,
          status: current.lastActiveStatus ?? "Completed",
          activityHistory: [
            {
              id: `${current.id}-restored-${Date.now()}`,
              action: "report.restored",
              actor: displayName,
              timestamp: "Just now",
              detail: "The report was restored to active workspaces.",
            },
            ...current.activityHistory,
          ].slice(0, 6),
        }),
      );
      logReportInteraction(
        report,
        "report.restored",
        `${report.title} was restored to active workspaces.`,
        "Report restored",
      );
      pushToast({
        title: "Report restored",
        description: `${report.title} is active again.`,
        tone: "success",
      });
    } finally {
      setReportActionLoading(report.id, "restore", false);
    }
  }

  async function handleDeleteReport() {
    if (!reportDeleteCandidate) {
      return;
    }

    const report = reportDeleteCandidate;
    setReportActionLoading(report.id, "delete", true);

    try {
      const response = await fetch(`/api/account/reports/${report.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Delete failed",
          description: payload?.error ?? "Unable to delete this report right now.",
          tone: "error",
        });
        return;
      }

      updateReportInSnapshot(report.id, (current) =>
        buildRichReportRecord({
          ...current,
          ...(payload?.report ?? {}),
          archivedAt: payload?.report?.archivedAt ?? current.archivedAt ?? new Date().toISOString(),
          deletedAt: payload?.report?.deletedAt ?? new Date().toISOString(),
          isArchived: true,
          lastActiveStatus:
            current.status === "Archived"
              ? current.lastActiveStatus ?? "Completed"
              : current.status,
          status: "Archived",
          activityHistory: [
            {
              id: `${current.id}-deleted-${Date.now()}`,
              action: "report.deleted",
              actor: displayName,
              timestamp: "Just now",
              detail: "The report was soft-deleted and removed from active workspaces.",
            },
            ...current.activityHistory,
          ].slice(0, 6),
        }),
      );
      logReportInteraction(
        report,
        "report.deleted",
        `${report.title} was soft-deleted and removed from active workspaces.`,
        "Report deleted",
      );
      pushToast({
        title: "Report deleted",
        description: `${report.title} was archived and removed from active views.`,
        tone: "success",
      });
      setReportDeleteCandidate(null);
    } finally {
      setReportActionLoading(report.id, "delete", false);
    }
  }

  async function handleShareReport(report: ReportRecord) {
    setReportActionLoading(report.id, "share", true);
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/reports#${report.id}`
        : `/dashboard/reports#${report.id}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }

      updateReportInSnapshot(report.id, (current) => ({
        ...current,
        activityHistory: [
          {
            id: `${current.id}-shared-${Date.now()}`,
            action: "report.shared",
            actor: displayName,
            timestamp: "Just now",
            detail: "A secure deep-link was copied for collaboration.",
          },
          ...current.activityHistory,
        ].slice(0, 6),
      }));
      logReportInteraction(
        report,
        "report.shared",
        `${report.title} share link copied for workspace collaboration.`,
        "Share link copied",
      );
      pushToast({
        title: "Share link copied",
        description: `${report.title} is ready to share with your team.`,
        tone: "success",
      });
    } finally {
      setReportActionLoading(report.id, "share", false);
    }
  }

  async function handleDuplicateReport(report: ReportRecord) {
    setReportActionLoading(report.id, "duplicate", true);

    try {
      const response = await fetch(`/api/account/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "duplicate" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Duplicate failed",
          description: payload?.error ?? "Unable to duplicate this report.",
          tone: "error",
        });
        return;
      }

      const duplicatedReport = buildRichReportRecord(payload.report as ReportRecord);
      setDashboardSnapshot((current) =>
        applySuccessfulReportEffects(
          {
            ...current,
            reports: [duplicatedReport, ...current.reports].slice(0, 8),
          },
          duplicatedReport,
        ),
      );
      logReportInteraction(
        duplicatedReport,
        "report.duplicated",
        `${duplicatedReport.title} was created from an existing report template.`,
        "Report duplicated",
      );
      pushToast({
        title: "Report duplicated",
        description: `${duplicatedReport.title} was added to the queue.`,
        tone: "success",
      });
    } finally {
      setReportActionLoading(report.id, "duplicate", false);
    }
  }

  async function handleRegenerateReport(report: ReportRecord) {
    setReportActionLoading(report.id, "regenerate", true);
    updateReportInSnapshot(report.id, (current) =>
      buildRichReportRecord({
        ...current,
        status: "Processing",
        generatedAt: "Refreshing...",
        activityHistory: [
          {
            id: `${current.id}-regen-${Date.now()}`,
            action: "report.regenerated",
            actor: displayName,
            timestamp: "Just now",
            detail: "A fresh report transaction is rebuilding the artifact.",
          },
          ...current.activityHistory,
        ].slice(0, 6),
      }),
    );
    try {
      const response = await fetch(`/api/account/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "regenerate" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        updateReportInSnapshot(report.id, () => report);
        pushToast({
          title: "Regeneration failed",
          description: payload?.error ?? "Unable to regenerate this report.",
          tone: "error",
        });
        return;
      }

      const regeneratedReport = buildRichReportRecord(payload.report as ReportRecord);
      updateReportInSnapshot(report.id, () => ({
        ...regeneratedReport,
        activityHistory: [
          {
            id: `${report.id}-regen-complete-${Date.now()}`,
            action: "report.regenerated",
            actor: "Report Queue",
            timestamp: "Just now",
            detail: "The regenerated report completed successfully and refreshed all metrics.",
          },
          ...regeneratedReport.activityHistory,
        ].slice(0, 6),
      }));
      logReportInteraction(
        regeneratedReport,
        "report.regenerated",
        `${regeneratedReport.title} completed a fresh enterprise report generation cycle.`,
        "Report regenerated",
      );
      pushToast({
        title: "Report regenerated",
        description: `${regeneratedReport.title} has been refreshed with updated metrics.`,
        tone: "success",
      });
    } finally {
      setReportActionLoading(report.id, "regenerate", false);
    }
  }

  async function refreshActivityLogs(options?: { silent?: boolean }) {
    if (!["ADMIN", "MANAGER"].includes(role)) {
      return;
    }

    setSyncingActivities(true);

    try {
      const response = await fetch("/api/admin/activity-logs?limit=50");
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Activity sync failed",
          description: payload?.error ?? "Unable to refresh the audit stream.",
          tone: "error",
        });
        return;
      }

      const logs = Array.isArray(payload?.logs)
        ? (payload.logs as Array<{
            id: string;
            action: string;
            createdAt: string;
            entityId?: string | null;
            entityType?: string | null;
            ipAddress?: string | null;
            user?: {
              name?: string | null;
            } | null;
          }>)
        : [];
      setLiveActivities(
        logs.map((entry) => ({
          id: entry.id,
          actor: entry.user?.name ?? "System",
          action: entry.action,
          resource: entry.entityType
            ? `${entry.entityType}${entry.entityId ? ` ${entry.entityId}` : ""}`
            : "SynapseOS action",
          timestamp: new Date(entry.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          severity:
            typeof entry.action === "string" && entry.action.toLowerCase().includes("delete")
              ? "Critical"
              : typeof entry.action === "string" &&
                  (entry.action.toLowerCase().includes("role") ||
                    entry.action.toLowerCase().includes("report"))
                ? "Warning"
                : "Info",
          ipAddress: entry.ipAddress ?? "127.0.0.1",
        })),
      );
      setLastUpdatedAt(formatTimestamp());
      if (!options?.silent) {
        pushToast({
          title: "Audit stream refreshed",
          description: "The latest persisted activity records are now visible.",
          tone: "success",
        });
      }
    } finally {
      setSyncingActivities(false);
    }
  }

  async function handleAssignRole(userId: string, nextRole: UserRole) {
    setAssigningRoles((current) => ({ ...current, [userId]: true }));
    const previousRole = snapshot.users.find((user) => user.id === userId)?.role;

    setDashboardSnapshot((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              role: nextRole,
            }
          : user,
      ),
    }));

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (previousRole) {
          setDashboardSnapshot((current) => ({
            ...current,
            users: current.users.map((user) =>
              user.id === userId
                ? {
                    ...user,
                    role: previousRole,
                  }
                : user,
            ),
          }));
        }
        pushToast({
          title: "Role update failed",
          description: payload?.error ?? "Unable to persist the new role.",
          tone: "error",
        });
        return;
      }

      setLastUpdatedAt(formatTimestamp());
      pushToast({
        title: "Role assigned",
        description: `The user now has ${nextRole} access.`,
        tone: "success",
      });
    } finally {
      setAssigningRoles((current) => ({ ...current, [userId]: false }));
    }
  }

  async function handleLoadUserSummary(userId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/summary`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        pushToast({
          title: "Unable to load summary",
          description: payload?.error ?? "The user summary procedure could not be loaded.",
          tone: "error",
        });
        return;
      }

      const summary = Array.isArray(payload?.summary) ? payload.summary[0] : null;

      if (!summary) {
        pushToast({
          title: "No summary available",
          description: "No database-backed summary was returned for this user.",
          tone: "info",
        });
        return;
      }

      setSelectedUserSummary({
        userName: summary.user_name,
        email: summary.email,
        notifications: Array.isArray(summary.notifications) ? summary.notifications.length : 0,
        activities: Array.isArray(summary.activities) ? summary.activities.length : 0,
        reports: Array.isArray(summary.reports) ? summary.reports.length : 0,
      });
      setLastUpdatedAt(formatTimestamp());
    });
  }

  async function handleDeleteUser(userId: string) {
    const targetUser = snapshot.users.find((user) => user.id === userId);

    if (!targetUser) {
      return;
    }

    setDeletingUsers((current) => ({ ...current, [userId]: true }));
    setDashboardSnapshot((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== userId),
    }));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setDashboardSnapshot((current) => ({
          ...current,
          users: [targetUser, ...current.users],
        }));
        pushToast({
          title: "Delete failed",
          description: payload?.error ?? "Unable to remove this operator right now.",
          tone: "error",
        });
        return;
      }

      setLastUpdatedAt(formatTimestamp());
      pushToast({
        title: "User removed",
        description: `${targetUser.name} was removed from the SynapseOS workspace.`,
        tone: "success",
      });
    } finally {
      setDeletingUsers((current) => ({ ...current, [userId]: false }));
    }
  }

  const isAdminOverview = role === "ADMIN" && section === "overview";
  const showAdminOverview = isAdminOverview && adminWorkspaceTab === "overview";
  const showAdminSecurity = isAdminOverview && adminWorkspaceTab === "security";
  const showAdminAnalytics = isAdminOverview && adminWorkspaceTab === "analytics";
  const showAdminReports = isAdminOverview && adminWorkspaceTab === "reports";
  const showAdminUsers = isAdminOverview && adminWorkspaceTab === "users";
  const showAdminMonitoring = isAdminOverview && adminWorkspaceTab === "monitoring";
  const isManagerOverview = role === "MANAGER" && section === "overview";
  const isUserOverview = role === "USER" && section === "overview";

  return (
    <div className="space-y-4">
      <section id="workspace-overview" tabIndex={-1} className="relative overflow-hidden rounded-[1.6rem] border border-cyan-500/10 bg-gradient-to-br from-[#071226] via-[#08172f] to-[#0a1024] p-4 shadow-lg shadow-black/10 md:p-5 [content-visibility:auto] [contain-intrinsic-size:300px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.11),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(139,92,246,0.08),transparent_32%)]" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <Badge className="type-caption rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100 shadow-sm shadow-cyan-950/20">
              {meta.eyebrow}
            </Badge>
            <div className="mt-3 flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] shadow-sm shadow-cyan-950/20">
                <Icon className="size-5 text-cyan-100" />
              </div>
              <div>
                <h2 className="type-display bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-2xl text-transparent md:text-4xl">
                  {meta.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:max-w-md xl:flex-1">
            <SectionCard className="p-3">
              <p className="text-sm text-white/42">Signed in</p>
              <p className="mt-1 font-medium text-white">{displayName}</p>
              <p className="mt-1 text-sm text-white/55">{roleLabel}</p>
            </SectionCard>
            <SectionCard className="p-3">
              <p className="text-sm text-white/42">Workspace sync</p>
              <p className="mt-1 font-medium text-white">Updated {lastUpdatedAt}</p>
              <p className="mt-1 text-xs text-white/50">{liveStatus.detail}</p>
            </SectionCard>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {snapshot.kpis.map((metric) => (
          <div key={metric.label} className="transition-transform duration-200 hover:-translate-y-0.5">
            <SectionCard className="group">
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/50">{metric.label}</p>
                    <div className="type-metric mt-2 text-2xl text-white">
                      <AnimatedCounter value={metric.value} prefix={metric.prefix} suffix={metric.suffix} decimals={metric.suffix === "%" && metric.value > 99 ? 3 : 0} />
                    </div>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-sm shadow-cyan-950/20 transition-transform duration-200 group-hover:scale-105">
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium text-white">{metric.change}</p>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-white/45">{metric.detail}</p>
              </div>
            </SectionCard>
          </div>
        ))}
      </div>

      <SectionCard className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-3 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-cyan-300/35 opacity-75 [animation:pulse_2.6s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              <span className="relative inline-flex size-3 rounded-full bg-cyan-300" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="type-caption text-cyan-100/80">Realtime enterprise simulation</p>
                <Badge className={cn("rounded-full border", toneMap[liveStatus.tone])}>
                  {liveStatus.label}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-white/50">
                Streaming metrics, audit events, alerts, chart points, and AI context every few seconds.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveAlerts.length ? (
              liveAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => setLiveAlerts((current) => current.filter((item) => item.id !== alert.id))}
                  className={cn(
                    "max-w-[260px] rounded-xl border px-3 py-2 text-left transition-colors duration-200 hover:bg-white/[0.05]",
                    toneMap[alert.severity],
                  )}
                  title={`${alert.title}: ${alert.message}`}
                >
                  <span className="block truncate text-xs font-medium">{alert.title}</span>
                  <span className="mt-1 block truncate text-[11px] opacity-75">{alert.timestamp}</span>
                </button>
              ))
            ) : (
              <Badge className="rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                <span className="mr-1.5 size-1.5 rounded-full bg-emerald-300" />
                No active alerts
              </Badge>
            )}
          </div>
        </div>
      </SectionCard>

      {isAdminOverview ? (
        <div className="rounded-[1.35rem] border border-cyan-500/10 bg-[#081120] p-2 shadow-lg shadow-black/10">
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {adminWorkspaceTabs.map((tab) => {
              const active = adminWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdminWorkspaceTab(tab.id)}
                  className={cn(
                    "rounded-[1rem] border px-3 py-2 text-left transition-colors duration-200",
                    active
                      ? "border-cyan-300/20 bg-cyan-300/10 text-white"
                      : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <span className="block text-sm font-medium">{tab.label}</span>
                  <span className="mt-1 hidden text-xs text-white/38 xl:block">{tab.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {isAdminOverview ? (
        <div className="grid gap-3 2xl:grid-cols-[1.15fr_0.85fr]">
          {showAdminOverview ? (
          <SectionCard>
            <SectionTitle
              title="Admin Control Center"
              description="Centralized identity, RBAC, audit, security, and operational command surface."
              action={
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-cyan-400/18 bg-cyan-400/[0.05] text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
                    onClick={openCreateUserModal}
                  >
                    <UserPlus className="size-4" />
                    Create user
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={() => void handleExportAuditLogs()}
                  >
                    <FileJson2 className="size-4" />
                    Export logs
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-emerald-400/18 bg-emerald-400/[0.05] text-emerald-100 hover:bg-emerald-400/10 hover:text-emerald-50"
                    onClick={() => {
                      void refreshActivityLogs();
                      pushToast({
                        title: "System scan started",
                        description: "Audit stream, database health, and notification posture are being refreshed.",
                        tone: "info",
                      });
                    }}
                  >
                    <Radar className="size-4" />
                    System scan
                  </Button>
                </div>
              }
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Active users", adminControlMetrics.activeUsers.toLocaleString("en-US"), "Live identities", UsersRound],
                ["Reports created", adminControlMetrics.reportsCreated.toLocaleString("en-US"), "Persisted workflows", FileText],
                ["Transactions", adminControlMetrics.transactionsProcessed.toLocaleString("en-US"), "DBMS operations", DatabaseZap],
                ["Uptime", `${adminControlMetrics.uptime}%`, "Control plane SLA", ShieldCheck],
                ["Security alerts", adminControlMetrics.securityAlerts.toString(), "Failed/suspended signals", Siren],
                ["Audit events", adminControlMetrics.auditEvents.toString(), "Timeline records", Bot],
                ["DB health", `${adminControlMetrics.databaseHealth}%`, "Storage/query posture", HardDrive],
                ["Role changes", adminControlMetrics.roleChanges.toString(), "Privilege updates", ShieldAlert],
              ].map(([label, value, detail, MetricIcon]) => (
                <div key={label as string} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/45">{label as string}</p>
                      <p className="type-metric mt-2 text-xl text-white">{value as string}</p>
                      <p className="mt-1 text-xs text-white/42">{detail as string}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/14 bg-cyan-300/8 p-2 text-cyan-100">
                      <MetricIcon className="size-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          ) : null}

          {showAdminOverview ? (
          <SectionCard>
            <SectionTitle
              title="Operational pulse"
              description="Notifications and activity merged into one executive signal stream."
              action={
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  onClick={() => setAdminWorkspaceTab("security")}
                >
                  Review security
                </Button>
              }
            />
            <div className="space-y-2">
              {[...unreadNotifications.slice(0, 2).map((item) => ({
                id: `notification-${item.id}`,
                label: item.title,
                detail: item.message,
                meta: item.time,
                tone: "Info" as const,
              })), ...snapshot.activities.slice(0, 3).map((item) => ({
                id: `activity-${item.id}`,
                label: `${item.actor} ${item.action}`,
                detail: item.resource,
                meta: item.timestamp,
                tone: item.severity,
              }))].slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 truncate text-xs text-white/45">{item.detail}</p>
                  </div>
                  <Badge className={cn("shrink-0 rounded-full border", toneMap[item.tone])}>
                    {item.meta}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
          ) : null}

          {showAdminSecurity ? (
          <SectionCard>
            <SectionTitle
              title="Security Center"
              description="Suspicious login tracking, active session posture, and role escalation visibility."
            />
            <div className="space-y-3">
              {[
                {
                  label: "Suspicious login alerts",
                  value: adminControlMetrics.failedLogins,
                  detail: "Failed or anomalous login audit records",
                  tone: adminControlMetrics.failedLogins > 0 ? "Critical" : "Info",
                },
                {
                  label: "Active sessions",
                  value: adminControlMetrics.activeUsers,
                  detail: "Estimated active user sessions from account status",
                  tone: "Info",
                },
                {
                  label: "Role escalation logs",
                  value: adminControlMetrics.roleChanges,
                  detail: "Recent RBAC mutations in the audit stream",
                  tone: adminControlMetrics.roleChanges > 0 ? "Warning" : "Info",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-white/50">{item.detail}</p>
                    </div>
                    <Badge className={cn("rounded-full border", toneMap[item.tone as keyof typeof toneMap])}>
                      {item.value}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full rounded-xl border-rose-400/18 bg-rose-400/[0.05] text-rose-100 hover:bg-rose-400/10 hover:text-rose-50"
                onClick={() =>
                  pushToast({
                    title: "Session revocation simulated",
                    description: "Demo mode recorded the revoke action in the security center workflow.",
                    tone: "info",
                  })
                }
              >
                <LockKeyhole className="size-4" />
                Revoke selected session
              </Button>
            </div>
          </SectionCard>
          ) : null}

          {showAdminSecurity ? (
          <SectionCard>
            <SectionTitle
              title="RBAC Permission Matrix"
              description="Real route and action restrictions enforced by middleware, API guards, and server-side permission checks."
            />
            <div className="overflow-x-auto rounded-[1.4rem] border border-white/8">
              <div className="min-w-[760px]">
                <div className="type-caption grid grid-cols-[1fr_0.55fr_0.55fr_0.55fr] gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-white/42">
                  <span>Permission</span>
                  {APP_ROLES.map((appRole) => (
                    <span key={appRole}>{appRole}</span>
                  ))}
                </div>
                {Array.from(new Set(Object.values(ROLE_PERMISSIONS).flat())).map((permission) => (
                  <div key={permission} className="grid grid-cols-[1fr_0.55fr_0.55fr_0.55fr] gap-3 border-b border-white/8 px-4 py-3 text-sm last:border-b-0">
                    <span className="type-mono text-white/70">{permission}</span>
                    {APP_ROLES.map((appRole) => {
                      const allowed = ROLE_PERMISSIONS[appRole].includes(permission);
                      return (
                        <span key={appRole} className={allowed ? "text-emerald-200" : "text-white/25"}>
                          {allowed ? "Allowed" : "Restricted"}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
          ) : null}

          {showAdminMonitoring ? (
          <SectionCard>
            <SectionTitle
              title="Database Monitoring"
              description="Operational throughput, latency, storage health, replication confidence, and anomaly detection."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Transaction throughput", `${adminControlMetrics.transactionsProcessed.toLocaleString("en-US")} ops`, "Healthy"],
                ["Query latency", `${snapshot.chartSeries.at(-1)?.latency ?? 142} ms`, "Monitoring"],
                ["Storage health", `${adminControlMetrics.databaseHealth}%`, "Healthy"],
                ["Replication health", "99.9%", "Guarded"],
                ["Anomaly detection", `${adminControlMetrics.securityAlerts} signals`, adminControlMetrics.securityAlerts ? "Monitoring" : "Healthy"],
              ].map(([label, value, state]) => (
                <div key={label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-white/45">{label}</p>
                  <p className="type-metric mt-3 text-2xl text-white">{value}</p>
                  <Badge className={cn("mt-3 rounded-full border", toneMap[state === "Healthy" ? "Online" : "Warning"])}>
                    {state}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
          ) : null}
        </div>
      ) : null}

      {isManagerOverview ? (
        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard>
            <SectionTitle
              title="Department operations workspace"
              description="Scoped team performance, assigned reports, and department workflow signals without admin-only controls."
              action={
                <Button
                  className="rounded-xl bg-white text-black hover:bg-white/90"
                  onClick={openReportComposer}
                >
                  Create report
                </Button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Team members", snapshot.team.length.toString(), "Assigned operators"],
                ["Department reports", filteredReports.length.toString(), "Scoped workflows"],
                ["Open alerts", unreadNotifications.length.toString(), "Team notifications"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/42">{label}</p>
                  <p className="type-metric mt-2 text-2xl text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/45">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {snapshot.insights.slice(0, 2).map((insight) => (
                <div key={insight.title} className="rounded-[1rem] border border-emerald-300/10 bg-emerald-300/[0.04] p-3">
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{insight.description}</p>
                  <p className="type-caption mt-2 text-emerald-100/70">{insight.stat}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle title="Team activity and workload" description="Manager-safe activity stream and operator workload posture." />
            <div className="space-y-2">
              {snapshot.team.slice(0, 4).map((member) => (
                <div key={member.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="mt-1 text-xs text-white/45">{member.function}</p>
                    </div>
                    <Badge className={cn("rounded-full border", toneMap[member.status])}>{member.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{member.workload}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="xl:col-span-2">
            <SectionTitle title="Department report queue" description="Assigned team reports and workflow states for manager operations." />
            <div className="grid gap-2 md:grid-cols-3">
              {snapshot.reports.slice(0, 6).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => openReportDetail(report)}
                  className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-emerald-300/20 hover:bg-emerald-300/[0.05]"
                >
                  <p className="truncate text-sm font-medium text-white">{report.title}</p>
                  <p className="mt-1 text-xs text-white/42">{report.owner} · {report.exportFormat}</p>
                  <Badge className={cn("mt-3 rounded-full border", toneMap[report.status])}>{report.status}</Badge>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {isUserOverview ? (
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard>
            <SectionTitle
              title="Personal productivity workspace"
              description="Your own reports, notifications, activity, and profile health. No admin or team controls exposed."
              action={
                <Button className="rounded-xl bg-white text-black hover:bg-white/90" onClick={openReportComposer}>
                  New report
                </Button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["My reports", snapshot.reports.length.toString(), "Assigned to you"],
                ["Notifications", visibleNotifications.length.toString(), "Personal inbox"],
                ["Security score", snapshot.profile.securityScore, "Account posture"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/42">{label}</p>
                  <p className="type-metric mt-2 text-2xl text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/45">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[1rem] border border-violet-300/10 bg-violet-300/[0.04] p-3">
              <p className="text-sm font-medium text-white">Personal analytics</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                You completed {snapshot.reports.filter((report) => report.status === "Completed").length} reports this cycle and have {unreadNotifications.length} unread alert(s).
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle title="My report queue" description="Only reports assigned to your personal workspace." />
            <div className="space-y-2">
              {snapshot.reports.slice(0, 5).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => openReportDetail(report)}
                  className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-violet-300/20 hover:bg-violet-300/[0.05]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{report.title}</p>
                    <p className="mt-1 text-xs text-white/42">{report.generatedAt} · {report.exportFormat}</p>
                  </div>
                  <Badge className={cn("shrink-0 rounded-full border", toneMap[report.status])}>{report.status}</Badge>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="xl:col-span-2">
            <SectionTitle title="Personal notifications and activity" description="Your own workflow alerts and recent personal events." />
            <div className="grid gap-2 md:grid-cols-2">
              {[...visibleNotifications.slice(0, 3).map((item) => ({
                id: `notification-${item.id}`,
                label: item.title,
                detail: item.message,
                meta: item.time,
              })), ...snapshot.activities.slice(0, 3).map((item) => ({
                id: `activity-${item.id}`,
                label: `${item.actor} ${item.action}`,
                detail: item.resource,
                meta: item.timestamp,
              }))].slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-3">
                  <p className="truncate text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/45">{item.detail}</p>
                  <p className="type-caption mt-2 text-white/35">{item.meta}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {(showAdminMonitoring || section === "analytics" || section === "activity-logs" || section === "system-metrics") && (
        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard>
            <SectionTitle
              title="DBMS showcase"
              description="Visible proof of transactions, procedure-backed analytics, audit logging, trigger-style automation, and relational integrity."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {snapshot.dbmsCapabilities.map((capability) => (
                <div key={capability.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.045]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-medium text-white">{capability.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{capability.description}</p>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full border",
                        capability.status === "Active"
                          ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                          : capability.status === "Fallback"
                            ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                            : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
                      )}
                    >
                      {capability.status}
                    </Badge>
                  </div>
                  <p className="type-caption mt-4 text-white/38">{capability.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle
              title="Transaction monitoring"
              description="Role-safe visibility into the critical database write flows that power SynapseOS."
              action={
                role === "ADMIN" ? (
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={handleProcessNotifications}
                    disabled={isPending}
                  >
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Bot className="size-4" />}
                    Process queue
                  </Button>
                ) : undefined
              }
            />
            <div className="space-y-3">
              {snapshot.transactionMonitor.map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.045]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.label}</p>
                    <Badge
                      className={cn(
                        "rounded-full border",
                        item.state === "Healthy"
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : item.state === "Monitoring"
                            ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                            : "border-amber-300/20 bg-amber-300/10 text-amber-100",
                      )}
                    >
                      {item.state}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {(showAdminAnalytics || section === "analytics") && (
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard className="min-w-0">
            <SectionTitle title="Analytics overview" description={analyticsDescription} />
            <AnalyticsOverviewChart data={chartSeries} role={role} />
          </SectionCard>

          <SectionCard className="min-w-0">
            <SectionTitle title="Highlights" description="Realtime signals matched to your role scope." />
            <div className="space-y-3">
              {snapshot.insights.map((insight) => (
                <div key={insight.title} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.045]">
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">{insight.description}</p>
                  <p className="type-caption mt-3 text-cyan-100/70">{insight.stat}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {(showAdminAnalytics || section === "analytics" || section === "activity-logs") && (
        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard className="min-w-0">
            <SectionTitle
              title="Database visualization"
              description="Activity timeline, query analytics, and throughput signals surfaced directly inside the premium dashboard."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {snapshot.queryAnalytics.map((item) => (
                <div key={item.label} className="min-w-0 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.045]">
                  <p className="text-sm text-white/45">{item.label}</p>
                  <p className="type-metric mt-3 text-2xl text-white">{item.value.toLocaleString("en-US")}</p>
                  <p className="type-caption mt-2 text-cyan-100/70">{item.change}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 min-w-0">
              <DatabaseVisualizationChart data={chartSeries} role={role} />
            </div>
          </SectionCard>

          <SectionCard className="min-w-0">
            <SectionTitle
              title="Activity timeline"
              description="Recent database-backed events rendered as a realtime-feeling operational timeline."
            />
            <div className="space-y-3">
              {snapshot.activityTimeline.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div
                    className={cn(
                      "mt-1 size-3 rounded-full",
                      item.tone === "critical"
                        ? "bg-rose-400"
                        : item.tone === "warning"
                          ? "bg-amber-300"
                          : "bg-cyan-300",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="type-caption text-white/35">{item.timestamp}</p>
                    </div>
                    <p className="mt-2 text-sm text-white/58">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {(showAdminReports || section === "reports") && (
        <SectionCard id="reports-workspace" tabIndex={-1}>
          <SectionTitle
            title={role === "USER" ? "Assigned reports" : "Reports workspace"}
            description={role === "USER" ? "Reports currently assigned to your account." : "Managed reporting flows and export states for your scope."}
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => void handleExportReports()}
                    disabled={!filteredReports.length || exportingReportId === "all"}
                    title="Download JSON report manifest"
                  >
                    {exportingReportId === "all" ? <LoaderCircle className="size-4 animate-spin" /> : <FileJson2 className="size-4" />}
                  Export manifest
                  </Button>
                <AccessGate role={role} permissions={["reports:create"]}>
                  <Button
                    className="rounded-xl bg-white text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90"
                    onClick={openReportComposer}
                  >
                    Create report
                  </Button>
                </AccessGate>
              </div>
            }
          />
          <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px_180px]">
            <Input
              value={reportQuery}
              onChange={(event) => {
                setReportPage(1);
                setReportQuery(event.target.value);
              }}
              placeholder="Search reports, owners, or report IDs..."
              className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
            />
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <select
                value={reportStatusFilter}
                onChange={(event) => {
                  setReportPage(1);
                  setReportStatusFilter(event.target.value as ReportStatusFilter);
                }}
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] pl-10 pr-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                style={{ colorScheme: "dark" }}
              >
                <option value="ALL" className="bg-[#081222] text-white">
                  All statuses
                </option>
                <option value="Completed" className="bg-[#081222] text-white">
                  Completed
                </option>
                <option value="Draft" className="bg-[#081222] text-white">
                  Draft
                </option>
                <option value="Processing" className="bg-[#081222] text-white">
                  Processing
                </option>
                <option value="Queued" className="bg-[#081222] text-white">
                  Queued
                </option>
                <option value="Failed" className="bg-[#081222] text-white">
                  Failed
                </option>
                <option value="Archived" className="bg-[#081222] text-white">
                  Archived
                </option>
              </select>
            </div>
            <select
              value={reportLifecycleFilter}
              onChange={(event) => {
                setReportPage(1);
                setReportLifecycleFilter(event.target.value as ReportLifecycleFilter);
              }}
              className="h-11 rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
              style={{ colorScheme: "dark" }}
            >
              <option value="ACTIVE" className="bg-[#081222] text-white">
                Active
              </option>
              <option value="ARCHIVED" className="bg-[#081222] text-white">
                Archived
              </option>
              <option value="ALL" className="bg-[#081222] text-white">
                All
              </option>
            </select>
            <select
              value={reportOwnerFilter}
              onChange={(event) => {
                setReportPage(1);
                setReportOwnerFilter(event.target.value);
              }}
              className="h-11 rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
              style={{ colorScheme: "dark" }}
            >
              <option value="ALL" className="bg-[#081222] text-white">
                All owners
              </option>
              {reportOwners.map((owner) => (
                <option key={owner} value={owner} className="bg-[#081222] text-white">
                  {owner}
                </option>
              ))}
            </select>
            <select
              value={reportSort}
              onChange={(event) => {
                setReportPage(1);
                setReportSort(event.target.value as ReportSortOption);
              }}
              className="h-11 rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
              style={{ colorScheme: "dark" }}
            >
              <option value="newest" className="bg-[#081222] text-white">
                Newest first
              </option>
              <option value="oldest" className="bg-[#081222] text-white">
                Oldest first
              </option>
              <option value="status" className="bg-[#081222] text-white">
                Sort by status
              </option>
              <option value="owner" className="bg-[#081222] text-white">
                Sort by owner
              </option>
            </select>
          </div>
          {filteredReports.length ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/8">
              <div className="overflow-x-auto">
                <div className="min-w-[1020px]">
                  <div className="type-caption grid grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr_0.55fr_0.95fr] gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-white/40">
                    <span>Report</span>
                    <span>Owner</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span>File</span>
                    <span>Actions</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {paginatedReports.map((report) => (
                      <div
                        key={report.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openReportDetail(report)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openReportDetail(report);
                          }
                        }}
                        className={cn(
                          "group grid cursor-pointer grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr_0.55fr_0.95fr] gap-3 px-4 py-4 transition-all duration-300 hover:bg-cyan-300/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.14)]",
                          report.isArchived && "opacity-60",
                        )}
                      >
                        <div>
                          <p className="font-medium text-white transition group-hover:text-cyan-100">{report.title}</p>
                          <p className="type-caption mt-1 text-white/35">{report.id}</p>
                          <p className="type-caption mt-2 text-cyan-100/70">{report.type}</p>
                          <p className="mt-2 max-w-[18rem] text-xs leading-5 text-white/45">{report.metadata.summary}</p>
                        </div>
                        <div className="text-sm text-white/58">
                          <p>{report.owner}</p>
                          <p className="mt-2 text-xs text-white/35">{report.ownerScope}</p>
                        </div>
                        <div className="space-y-2">
                          <Badge className={cn("w-fit rounded-full border transition", toneMap[report.status])}>{report.status}</Badge>
                          {report.isArchived && report.archivedAt ? (
                            <p className="text-xs text-white/35">
                              Archived {new Date(report.archivedAt).toLocaleDateString("en-US")}
                            </p>
                          ) : null}
                          <p className="text-xs text-white/38">
                            {report.analytics.rowsAnalyzed.toLocaleString("en-US")} rows
                          </p>
                        </div>
                        <div className="text-sm text-white/58">
                          <p>{report.generatedAt}</p>
                          <p className="mt-1 text-xs text-white/40">
                            {new Date(report.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-2 text-xs text-white/35">{report.analytics.executionDurationMs} ms</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/58">
                          {(() => {
                            const FormatIcon = reportFormatIconMap[report.exportFormat];
                            return <FormatIcon className="size-4 text-cyan-100" />;
                          })()}
                          <span>{report.exportFormat}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleExportReports(report);
                            }}
                            disabled={exportingReportId === report.id}
                            title={`Download ${report.exportFormat} report`}
                          >
                            {exportingReportId === report.id ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              openReportDetail(report);
                            }}
                          >
                            View
                          </Button>
                          {!report.isArchived && canManageOwnReport(report) ? (
                            <Button
                              variant="outline"
                              className="rounded-xl border-cyan-400/18 bg-cyan-400/[0.05] text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                openReportEditor(report);
                              }}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                          ) : null}
                          {!report.isArchived && canManageOwnReport(report) ? (
                            <Button
                              variant="outline"
                              className="rounded-xl border-amber-400/18 bg-amber-400/8 text-amber-100 hover:bg-amber-400/14 hover:text-amber-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleArchiveReport(report);
                              }}
                              disabled={reportActionState[report.id]?.archive}
                            >
                              {reportActionState[report.id]?.archive ? <LoaderCircle className="size-4 animate-spin" /> : null}
                              Archive
                            </Button>
                          ) : null}
                          {report.isArchived && canManageOwnReport(report) ? (
                            <Button
                              variant="outline"
                              className="rounded-xl border-emerald-400/18 bg-emerald-400/8 text-emerald-100 hover:bg-emerald-400/14 hover:text-emerald-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleRestoreReport(report);
                              }}
                              disabled={reportActionState[report.id]?.restore}
                            >
                              {reportActionState[report.id]?.restore ? <LoaderCircle className="size-4 animate-spin" /> : <ArchiveRestore className="size-4" />}
                              Restore
                            </Button>
                          ) : null}
                          {!report.isArchived && canDeleteReport(report) ? (
                            <Button
                              variant="outline"
                              className="rounded-xl border-red-500/20 bg-red-500/[0.04] text-red-300 hover:bg-red-500/10 hover:text-red-200"
                              onClick={(event) => {
                                event.stopPropagation();
                                setReportDeleteCandidate(report);
                              }}
                              disabled={reportActionState[report.id]?.delete}
                            >
                              {reportActionState[report.id]?.delete ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {(reportPage - 1) * 5 + 1}-{Math.min(reportPage * 5, filteredReports.length)} of {filteredReports.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    disabled={reportPage === 1}
                    onClick={() => setReportPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span>{reportPage}/{reportPageCount}</span>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    disabled={reportPage === reportPageCount}
                    onClick={() => setReportPage((current) => Math.min(reportPageCount, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Layers3}
              title={reportLifecycleFilter === "ACTIVE" ? "No active reports" : "No matching reports"}
              description={
                reportLifecycleFilter === "ACTIVE"
                  ? "Archived reports remain preserved for audit playback. Create a new report or switch to archived reports to restore one."
                  : "Adjust the search or filters, or launch a new reporting transaction for this workspace."
              }
              actionLabel={role === "USER" ? undefined : "Create report"}
              onAction={role === "USER" ? undefined : openReportComposer}
            />
          )}
        </SectionCard>
      )}

      <ReportDetailDialog
        open={reportViewerOpen}
        onOpenChange={setReportViewerOpen}
        report={selectedReport}
        onExport={(report) => void handleExportReports(report)}
        onArchive={(report) => void handleArchiveReport(report)}
        onDuplicate={(report) => void handleDuplicateReport(report)}
        onRegenerate={(report) => void handleRegenerateReport(report)}
        onShare={(report) => void handleShareReport(report)}
        actionLoading={
          selectedReport
            ? {
                ...reportActionState[selectedReport.id],
                export: exportingReportId === selectedReport.id,
              }
            : undefined
        }
      />

      <Dialog open={Boolean(reportDeleteCandidate)} onOpenChange={(open) => !open && setReportDeleteCandidate(null)}>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/10 bg-[#0b1120] p-0 text-white shadow-lg shadow-black/10">
          {reportDeleteCandidate ? (
            <>
              <DialogHeader className="border-b border-white/8 px-6 py-5">
                <DialogTitle className="type-heading text-xl text-white">Delete report?</DialogTitle>
                <DialogDescription className="type-body mt-2 leading-7 text-white/60">
                  This action will archive the report and remove it from active workspaces. Audit history will remain preserved.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-5">
                <div className="rounded-[1.4rem] border border-red-500/18 bg-red-500/[0.05] p-4">
                  <p className="font-medium text-white">{reportDeleteCandidate.title}</p>
                  <p className="mt-2 text-sm text-white/55">
                    {reportDeleteCandidate.id} · {reportDeleteCandidate.owner}
                  </p>
                </div>
              </div>
              <DialogFooter className="border-white/8 bg-white/[0.02]" showCloseButton>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-red-500/20 bg-red-500/[0.04] text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => void handleDeleteReport()}
                  disabled={Boolean(reportDeleteCandidate && reportActionState[reportDeleteCandidate.id]?.delete)}
                >
                  {reportDeleteCandidate && reportActionState[reportDeleteCandidate.id]?.delete ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete report
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {(showAdminSecurity || section === "notifications") && (
        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard>
            <SectionTitle title="Priority queue" description="Unread notifications that need attention." />
            {unreadNotifications.length ? (
              <div className="space-y-3">
                {unreadNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void openNotification(item).catch((error) => {
                        pushToast({
                          title: "Notification action failed",
                          description:
                            error instanceof Error ? error.message : "Unable to open this notification.",
                          tone: "error",
                        });
                      });
                    }}
                    className="w-full rounded-[1.4rem] border border-cyan-300/12 bg-cyan-300/8 p-4 text-left transition-colors duration-200 hover:border-cyan-300/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.title}</p>
                      <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Unread</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.message}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/35">
                      <span>{item.category}</span>
                      <span>{item.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BellRing}
                title="Nothing urgent right now"
                description="New alerts, report changes, and activity-driven notifications will surface here when they need your attention."
              />
            )}
          </SectionCard>
          <SectionCard id="notification-center" tabIndex={-1}>
              <SectionTitle
              title="All notifications"
              description="Realtime-feeling alerts with read state visibility."
              action={
                <div className="flex gap-2">
                  {visibleNotifications.some((item) => !item.read) ? (
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                      onClick={() => {
                        void markAllNotificationsRead().catch((error) => {
                          pushToast({
                            title: "Notification sync failed",
                            description:
                              error instanceof Error
                                ? error.message
                                : "Unable to mark every notification as read.",
                            tone: "error",
                          });
                        });
                      }}
                    >
                      <Check className="size-4" />
                      Mark all as read
                    </Button>
                  ) : null}
                  {role === "ADMIN" ? (
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                      onClick={handleProcessNotifications}
                      disabled={isPending}
                    >
                      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Bot className="size-4" />}
                      Process queue
                    </Button>
                  ) : null}
                </div>
              }
            />
            {visibleNotifications.length ? (
              <div className="space-y-3">
                {visibleNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void openNotification(item).catch((error) => {
                        pushToast({
                          title: "Notification action failed",
                          description:
                            error instanceof Error ? error.message : "Unable to open this notification.",
                          tone: "error",
                        });
                      });
                    }}
                    className={cn(
                      "w-full rounded-[1.4rem] border p-4 text-left transition-colors duration-200",
                      item.read ? "border-white/8 bg-white/[0.03]" : "border-cyan-300/14 bg-cyan-300/8",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.title}</p>
                      <Badge className={cn("rounded-full border", item.read ? "border-white/10 bg-white/[0.04] text-white/65" : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100")}>
                        {item.read ? "Read" : "Unread"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.message}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/35">
                      <span>{item.category}</span>
                      <span>{item.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BellRing}
                title="No notifications yet"
                description="Your personal notification feed will appear here once workflows, reports, or access events begin to trigger updates."
              />
            )}
          </SectionCard>
        </div>
      )}

      {(section === "profile" || section === "settings") && (
        <div id="profile-controls" tabIndex={-1} className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
          <SectionCard>
            <SectionTitle title="Profile summary" description="Avatar, role, security score, and account posture." />
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex size-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-lg font-semibold text-cyan-100">
                  {avatarPreviewLabel}
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{displayName}</p>
                  <p className="text-sm text-white/55">{snapshot.profile.email}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-white/45">Role</p>
                  <p className="mt-2 font-medium text-white">{snapshot.profile.role}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-white/45">Department</p>
                  <p className="mt-2 font-medium text-white">{snapshot.profile.department}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-white/45">Timezone</p>
                  <p className="mt-2 font-medium text-white">{snapshot.profile.timezone}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-white/45">Security score</p>
                  <p className="mt-2 font-medium text-white">{snapshot.profile.securityScore}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle title={section === "settings" ? "Account and security settings" : "Profile and security controls"} description="Production-style forms for avatar upload, profile updates, password changes, and account preferences." />
            <div className="grid gap-4">
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/78">Display name</span>
                      <Input
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                        placeholder="Update your display name"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/78">Avatar URL</span>
                      <Input
                        value={profileAvatar}
                        onChange={(event) => setProfileAvatar(event.target.value)}
                        className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                        placeholder="https://cdn.example.com/avatar.png"
                      />
                    </label>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                        {avatarPreviewLabel}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Avatar preview</p>
                        <p className="text-xs text-white/45">Preview updates before persisting them.</p>
                      </div>
                    </div>
                    {profileAvatar ? (
                      <p className="mt-3 truncate text-xs text-cyan-100/75">{profileAvatar}</p>
                    ) : (
                      <p className="mt-3 text-xs text-white/40">Provide a hosted image URL to replace the current initials avatar.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="rounded-xl bg-white text-black hover:bg-white/90"
                    onClick={handleProfileSave}
                    disabled={isPending}
                  >
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    Save profile
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={handleCopyInviteLink}
                  >
                    <ImageUp className="size-4" />
                    Copy onboarding link
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                      <KeyRound className="size-5 text-cyan-100" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">Password rotation</p>
                      <p className="text-sm text-white/52">Update your credentials with server-side validation.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">Current password</span>
                      <PasswordInput
                        value={securityForm.currentPassword}
                        onChange={(event) =>
                          setSecurityForm((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                        placeholder="Current password"
                        resetVisibilityKey={passwordVisibilityResetKey}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">New password</span>
                      <PasswordInput
                        value={securityForm.newPassword}
                        onChange={(event) =>
                          setSecurityForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                        placeholder="New password"
                        resetVisibilityKey={passwordVisibilityResetKey}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">Confirm new password</span>
                      <PasswordInput
                        value={securityForm.confirmPassword}
                        onChange={(event) =>
                          setSecurityForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                        placeholder="Confirm new password"
                        resetVisibilityKey={passwordVisibilityResetKey}
                      />
                    </label>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={handlePasswordUpdate}
                    disabled={isPending}
                  >
                    {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
                    Update password
                  </Button>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                      <ShieldCheck className="size-5 text-cyan-100" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">Workspace preferences</p>
                      <p className="text-sm text-white/52">Persist browser-level dashboard preferences for this workspace.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">Theme preference</span>
                      <select
                        value={settingsState.themePreference}
                        onChange={(event) =>
                          setSettingsState((current) => ({
                            ...current,
                            themePreference: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="system" className="bg-[#081222] text-white">System</option>
                        <option value="dark" className="bg-[#081222] text-white">Dark</option>
                        <option value="midnight" className="bg-[#081222] text-white">Midnight</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">Notification preference</span>
                      <select
                        value={settingsState.notificationPreference}
                        onChange={(event) =>
                          setSettingsState((current) => ({
                            ...current,
                            notificationPreference: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="priority" className="bg-[#081222] text-white">Priority only</option>
                        <option value="all" className="bg-[#081222] text-white">All notifications</option>
                        <option value="digest" className="bg-[#081222] text-white">Digest mode</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-white/78">Density</span>
                      <select
                        value={settingsState.density}
                        onChange={(event) =>
                          setSettingsState((current) => ({
                            ...current,
                            density: event.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="comfortable" className="bg-[#081222] text-white">Comfortable</option>
                        <option value="compact" className="bg-[#081222] text-white">Compact</option>
                      </select>
                    </label>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    onClick={handleSavePreferences}
                  >
                    <Check className="size-4" />
                    Save preferences
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {(section === "activity-logs") && (
        <SectionCard id="audit-workspace" tabIndex={-1}>
          <SectionTitle
            title="Searchable audit workspace"
            description="Filter persisted activity by actor, action, resource, IP, and severity with a production-style operator workflow."
            action={
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                onClick={() => void refreshActivityLogs()}
                disabled={syncingActivities}
              >
                {syncingActivities ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Refresh logs
              </Button>
            }
          />
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
            <Input
              value={activityQuery}
              onChange={(event) => {
                setActivityPage(1);
                setActivityQuery(event.target.value);
              }}
              placeholder="Search actor, action, resource, or IP..."
              className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
            />
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <select
                value={activitySeverityFilter}
                onChange={(event) => {
                  setActivityPage(1);
                  setActivitySeverityFilter(event.target.value as ActivitySeverityFilter);
                }}
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] pl-10 pr-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                style={{ colorScheme: "dark" }}
              >
                <option value="ALL" className="bg-[#081222] text-white">All severities</option>
                <option value="Info" className="bg-[#081222] text-white">Info</option>
                <option value="Warning" className="bg-[#081222] text-white">Warning</option>
                <option value="Critical" className="bg-[#081222] text-white">Critical</option>
              </select>
            </div>
          </div>
          {paginatedActivities.length ? (
            <div className="space-y-4">
              {paginatedActivities.map((entry) => (
                <div key={entry.id} className="flex gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className={cn("mt-1 size-3 rounded-full", entry.severity === "Critical" ? "bg-rose-400" : entry.severity === "Warning" ? "bg-amber-300" : "bg-cyan-300")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">
                        {entry.actor} <span className="text-white/45">{entry.action}</span>
                      </p>
                      <Badge className={cn("rounded-full border", toneMap[entry.severity])}>{entry.severity}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/35">
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{entry.resource}</span>
                      <span>{entry.ipAddress}</span>
                    </div>
                    <p className="mt-3 text-sm text-white/58">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm text-white/45">
                <span>
                  Showing {(activityPage - 1) * 4 + 1}-{Math.min(activityPage * 4, filteredActivities.length)} of {filteredActivities.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    disabled={activityPage === 1}
                    onClick={() => setActivityPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span>{activityPage}/{activityPageCount}</span>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                    disabled={activityPage === activityPageCount}
                    onClick={() => setActivityPage((current) => Math.min(activityPageCount, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No audit entries match the current filters"
              description="Broaden the audit search or reset the severity filter to reveal more persisted activity."
              actionLabel="Reset filters"
              onAction={() => {
                setActivityPage(1);
                setActivityQuery("");
                setActivitySeverityFilter("ALL");
              }}
            />
          )}
        </SectionCard>
      )}

      <AccessGate role={role} roles={["MANAGER", "ADMIN"]}>
        {(section === "team" || section === "departments") && (
          <div className="grid gap-4 xl:grid-cols-2">
            {section === "team" && (
              <SectionCard>
                <SectionTitle title="Assigned team data" description="Limited team data for managers and full team visibility for admins." />
                <div className="space-y-3">
                  {snapshot.team.map((member) => (
                    <div key={member.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="mt-1 text-sm text-white/48">{member.function}</p>
                        </div>
                        <Badge className={cn("rounded-full border", toneMap[member.status])}>{member.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-white/58">{member.workload}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {section === "departments" && (
              <SectionCard>
                <SectionTitle title="Department overview" description="Utilization, leadership, and active incident footprint." />
                <div className="space-y-3">
                  {snapshot.departments.map((department) => (
                    <div key={department.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{department.name}</p>
                          <p className="mt-1 text-sm text-white/48">Lead: {department.lead}</p>
                        </div>
                        <MoreHorizontal className="size-4 text-white/30" />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-white/35">Headcount</p>
                          <p className="mt-1 font-medium text-white">{department.headcount}</p>
                        </div>
                        <div>
                          <p className="text-white/35">Utilization</p>
                          <p className="mt-1 font-medium text-white">{department.utilization}%</p>
                        </div>
                        <div>
                          <p className="text-white/35">Incidents</p>
                          <p className="mt-1 font-medium text-white">{department.openIncidents}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {false && (
              <SectionCard>
                <SectionTitle title="Activity feed" description="Login events, report generation, and scoped operational updates." />
                <div className="space-y-4">
                  {snapshot.activities.map((entry) => (
                    <div key={entry.id} className="flex gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className={cn("mt-1 size-3 rounded-full", entry.severity === "Critical" ? "bg-rose-400" : entry.severity === "Warning" ? "bg-amber-300" : "bg-cyan-300")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-white">
                            {entry.actor} <span className="text-white/45">{entry.action}</span>
                          </p>
                          <Badge className={cn("rounded-full border", toneMap[entry.severity])}>{entry.severity}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-white/58">{entry.resource}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">
                          {entry.timestamp} • {entry.ipAddress}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </AccessGate>

      <AccessGate role={role} roles={["ADMIN"]}>
        {((section === "overview" && role !== "ADMIN") || showAdminUsers || section === "users") && (
          <SectionCard id="rbac-control-center" tabIndex={-1}>
            <SectionTitle
              title="User management"
              description="Search and moderate enterprise accounts with strict admin-only controls."
              action={
                <Button
                  className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-500 text-slate-950 shadow-sm shadow-cyan-950/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  onClick={openCreateUserModal}
                >
                  <UserPlus className="size-4" />
                  Create user
                </Button>
              }
            />
            {selectedUserSummary ? (
              <div className="mb-5 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-white">{selectedUserSummary.userName}</p>
                    <p className="mt-1 text-sm text-white/58">{selectedUserSummary.email}</p>
                  </div>
                  <Badge className="rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    Stored procedure summary
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-3">
                    <p className="text-sm text-white/45">Activities</p>
                    <p className="type-metric mt-2 text-xl text-white">{selectedUserSummary.activities}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-3">
                    <p className="text-sm text-white/45">Notifications</p>
                    <p className="type-metric mt-2 text-xl text-white">{selectedUserSummary.notifications}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-3">
                    <p className="text-sm text-white/45">Reports</p>
                    <p className="type-metric mt-2 text-xl text-white">{selectedUserSummary.reports}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid w-full gap-3 lg:max-w-3xl lg:grid-cols-[minmax(0,1fr)_170px_170px]">
                <Input value={userQuery} onChange={(event) => {
                  setPage(1);
                  setUserQuery(event.target.value);
                }} placeholder="Search users, email, department..." className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 transition focus:border-cyan-300/25 focus:bg-black/30" />
                <select
                  value={userRoleFilter}
                  onChange={(event) => {
                    setPage(1);
                    setUserRoleFilter(event.target.value as UserRole | "ALL");
                  }}
                  className="h-11 rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="ALL" className="bg-[#081222] text-white">All roles</option>
                  <option value="ADMIN" className="bg-[#081222] text-white">Admin</option>
                  <option value="MANAGER" className="bg-[#081222] text-white">Manager</option>
                  <option value="USER" className="bg-[#081222] text-white">User</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(event) => {
                    setPage(1);
                    setUserStatusFilter(event.target.value as UserStatusFilter);
                  }}
                  className="h-11 rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="ALL" className="bg-[#081222] text-white">All statuses</option>
                  <option value="Active" className="bg-[#081222] text-white">Active</option>
                  <option value="Provisioning" className="bg-[#081222] text-white">Provisioning</option>
                  <option value="Suspended" className="bg-[#081222] text-white">Suspended</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-white/[0.04] text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
                  onClick={() => {
                    setPage(1);
                    setUserQuery("");
                    setUserRoleFilter("ALL");
                    setUserStatusFilter("ALL");
                  }}
                >
                  Reset filters
                </Button>
                <Button className="rounded-2xl bg-white text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/90" onClick={() => void handleCopyInviteLink()}>
                  Invite operator
                </Button>
              </div>
            </div>
            {paginatedUsers.length ? (
              <div className="mt-5 overflow-x-auto rounded-[1.5rem] border border-white/8">
                <div className="min-w-[940px]">
                  <div className="type-caption hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/8 bg-white/[0.03] px-5 py-3 text-white/40 lg:grid">
                    <span>User</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Department</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {paginatedUsers.map((user) => (
                      <div key={user.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_1fr] lg:items-center">
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="type-caption mt-1 text-white/35">{user.id}</p>
                        </div>
                        <p className="text-sm text-white/55">{user.email}</p>
                        <Badge className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{user.role}</Badge>
                        <p className="text-sm text-white/60">{user.department}</p>
                        <Badge className={cn("w-fit rounded-full border", toneMap[user.status])}>{user.status}</Badge>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={selectedRoles[user.id] ?? user.role}
                            onChange={(event) =>
                              setSelectedRoles((current) => ({
                                ...current,
                                [user.id]: event.target.value as UserRole,
                              }))
                            }
                            className="h-10 rounded-xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="ADMIN" className="bg-[#081222] text-white">
                              ADMIN
                            </option>
                            <option value="MANAGER" className="bg-[#081222] text-white">
                              MANAGER
                            </option>
                            <option value="USER" className="bg-[#081222] text-white">
                              USER
                            </option>
                          </select>
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                            onClick={() => handleAssignRole(user.id, selectedRoles[user.id] ?? user.role)}
                            disabled={assigningRoles[user.id]}
                          >
                            {assigningRoles[user.id] ? <LoaderCircle className="size-4 animate-spin" /> : null}
                            Assign role
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-cyan-400/18 bg-cyan-400/[0.05] text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
                            onClick={() => openEditUserModal(user)}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                            onClick={() => handleLoadUserSummary(user.id)}
                            disabled={isPending}
                          >
                            Summary
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                            onClick={() => void handleCopyUserEmail(user.email)}
                          >
                            <Check className="size-4" />
                            Copy email
                          </Button>
                          <Button
                            variant="outline"
                            className={cn(
                              "rounded-xl",
                              user.status === "Suspended"
                                ? "border-emerald-400/18 bg-emerald-400/[0.05] text-emerald-100 hover:bg-emerald-400/10 hover:text-emerald-50"
                                : "border-amber-300/18 bg-amber-300/[0.05] text-amber-100 hover:bg-amber-300/10 hover:text-amber-50",
                            )}
                            onClick={() => void handleToggleUserStatus(user)}
                          >
                            {user.status === "Suspended" ? "Reactivate" : "Suspend"}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-rose-400/18 bg-rose-400/8 text-rose-100 hover:bg-rose-400/14 hover:text-rose-50"
                            onClick={() => void handleDeleteUser(user.id)}
                            disabled={deletingUsers[user.id]}
                          >
                            {deletingUsers[user.id] ? <LoaderCircle className="size-4 animate-spin" /> : null}
                            Delete user
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={UsersRound}
                  title="No matching users"
                  description="Try a broader search term or invite a new operator to populate this management surface."
                  actionLabel="Invite operator"
                  onAction={() => void handleCopyInviteLink()}
                />
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-sm text-white/45">
              <span>Showing {(page - 1) * 4 + 1}-{Math.min(page * 4, filteredUsers.length)} of {filteredUsers.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                <span>{page}/{pageCount}</span>
                <Button variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</Button>
              </div>
            </div>
          </SectionCard>
        )}

        {((section === "overview" && role !== "ADMIN") || showAdminMonitoring || section === "system-metrics") && snapshot.systemMetrics.length > 0 && (
          <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
            <SectionCard className="min-w-0">
              <SectionTitle title="System metrics" description="Admin-only runtime and database visibility." />
              <div className="space-y-3">
                {snapshot.systemMetrics.map((metric) => (
                  <div key={metric.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/45">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {metric.current}
                          {metric.unit}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-white/60">
                        {metric.unit === "%" ? <Cpu className="size-4" /> : <HardDrive className="size-4" />}
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400" style={{ width: `${Math.min((metric.current / metric.threshold) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard className="min-w-0">
              <SectionTitle title="System load timeline" description="CPU, memory, sessions, and database footprint over time." />
              <SystemLoadChart data={chartSeries} role={role} />
            </SectionCard>
          </div>
        )}
      </AccessGate>

      <Dialog
        open={userModalOpen}
        onOpenChange={(open) => {
          if (savingUser) {
            return;
          }
          setUserModalOpen(open);
          if (!open) {
            setEditingUser(null);
            setUserForm(defaultAdminUserForm);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b1120] text-white shadow-lg shadow-black/10">
          <DialogHeader>
            <DialogTitle className="type-heading text-white">
              {editingUser ? "Edit enterprise user" : "Create enterprise user"}
            </DialogTitle>
            <DialogDescription className="text-white/58">
              {editingUser
                ? "Update identity metadata, role assignment, department scope, and account status with audit logging."
                : "Provision a SynapseOS identity with hashed credentials, RBAC assignment, notification routing, and audit history."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void handleSaveUser(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Full name</span>
                <Input
                  autoFocus
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ariana Kent"
                  className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Email</span>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="operator@synapseos.dev"
                  className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                  required
                />
              </label>
              {!editingUser ? (
                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-white/78">Temporary password</span>
                  <PasswordInput
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Minimum 8 characters"
                    className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                    required
                  />
                  <p className="text-xs leading-5 text-white/42">
                    Passwords are hashed before storage. Ask the operator to rotate this credential after first login.
                  </p>
                </label>
              ) : null}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Department</span>
                <Input
                  value={userForm.department}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, department: event.target.value }))
                  }
                  placeholder="Infrastructure"
                  className="h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Role</span>
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, role: event.target.value as UserRole }))
                  }
                  className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="ADMIN" className="bg-[#081222] text-white">ADMIN</option>
                  <option value="MANAGER" className="bg-[#081222] text-white">MANAGER</option>
                  <option value="USER" className="bg-[#081222] text-white">USER</option>
                </select>
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-white/78">Account status</span>
                <select
                  value={userForm.status}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      status: event.target.value as AdminUserFormState["status"],
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="ACTIVE" className="bg-[#081222] text-white">Active</option>
                  <option value="INVITED" className="bg-[#081222] text-white">Provisioning</option>
                  <option value="SUSPENDED" className="bg-[#081222] text-white">Suspended</option>
                </select>
              </label>
            </div>
            <div className="rounded-[1.3rem] border border-cyan-300/12 bg-cyan-300/[0.04] p-4 text-sm leading-6 text-white/58">
              This operation is transaction-safe: SynapseOS persists identity changes, writes audit history, and refreshes the admin directory optimistically.
            </div>
            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                disabled={savingUser}
                onClick={() => setUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-70"
                disabled={savingUser}
              >
                {savingUser ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {editingUser ? "Save user" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reportModalOpen} onOpenChange={closeReportComposer}>
        <DialogContent className="max-w-lg rounded-[2rem] border border-white/10 bg-[#0b1120] text-white shadow-lg shadow-black/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingReport ? "Edit DBMS-backed report" : "Create DBMS-backed report"}
            </DialogTitle>
            <DialogDescription className="text-white/58">
              {editingReport
                ? "Update persisted report metadata, workflow status, export format, and audit history."
                : "Launch a report transaction that persists the report, writes metrics, and routes downstream notifications."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void handleCreateReport(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-white/78">Report title</span>
                <Input
                  autoFocus
                  value={reportForm.title}
                  onChange={(event) => updateReportField("title", event.target.value)}
                  placeholder="Executive performance summary"
                  className={cn(
                    "h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30",
                    reportErrors.title ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                />
                {reportErrors.title ? (
                  <p className="text-sm text-rose-200">{reportErrors.title}</p>
                ) : null}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Report type</span>
                <select
                  value={reportForm.reportType}
                  onChange={(event) => updateReportField("reportType", event.target.value)}
                  className={cn(
                    "h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]",
                    reportErrors.reportType ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                  style={{ colorScheme: "dark" }}
                >
                  {reportTypeOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#081222] text-white">
                      {option}
                    </option>
                  ))}
                </select>
                {reportErrors.reportType ? (
                  <p className="text-sm text-rose-200">{reportErrors.reportType}</p>
                ) : null}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Export format</span>
                <select
                  value={reportForm.exportFormat}
                  onChange={(event) =>
                    updateReportField(
                      "exportFormat",
                      event.target.value as ReportRecord["exportFormat"],
                    )
                  }
                  className={cn(
                    "h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]",
                    reportErrors.exportFormat ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                  style={{ colorScheme: "dark" }}
                >
                  <option value="PDF" className="bg-[#081222] text-white">
                    PDF
                  </option>
                  <option value="CSV" className="bg-[#081222] text-white">
                    CSV
                  </option>
                  <option value="JSON" className="bg-[#081222] text-white">
                    JSON
                  </option>
                </select>
                {reportErrors.exportFormat ? (
                  <p className="text-sm text-rose-200">{reportErrors.exportFormat}</p>
                ) : null}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Owner</span>
                <Input
                  value={reportForm.owner}
                  onChange={(event) => updateReportField("owner", event.target.value)}
                  placeholder="Ariana Kent"
                  className={cn(
                    "h-11 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35 focus:border-cyan-300/25 focus:bg-black/30",
                    reportErrors.owner ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                />
                {reportErrors.owner ? (
                  <p className="text-sm text-rose-200">{reportErrors.owner}</p>
                ) : null}
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/78">Transaction timestamp</span>
                <Input
                  value={new Date(reportForm.requestedAt).toLocaleString("en-US")}
                  readOnly
                  className={cn(
                    "h-11 rounded-2xl border-white/10 bg-black/20 text-white/75 focus:border-cyan-300/25 focus:bg-black/30",
                    reportErrors.requestedAt ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                />
                {reportErrors.requestedAt ? (
                  <p className="text-sm text-rose-200">{reportErrors.requestedAt}</p>
                ) : null}
              </label>
              <label className="block space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-white/78">Workflow status</span>
                <select
                  value={reportForm.status}
                  onChange={(event) =>
                    updateReportField(
                      "status",
                      event.target.value as ReportFormState["status"],
                    )
                  }
                  className={cn(
                    "h-11 w-full rounded-2xl border border-white/10 bg-[#081222] px-3 text-sm font-medium text-white outline-none transition focus:border-cyan-300/25 focus:bg-[#0b1630]",
                    reportErrors.status ? "border-rose-400/40 focus:border-rose-400/50" : "",
                  )}
                  style={{ colorScheme: "dark" }}
                >
                  <option value="Draft" className="bg-[#081222] text-white">
                    Draft
                  </option>
                  <option value="Queued" className="bg-[#081222] text-white">
                    Queued
                  </option>
                  <option value="Processing" className="bg-[#081222] text-white">
                    Processing
                  </option>
                  <option value="Completed" className="bg-[#081222] text-white">
                    Completed
                  </option>
                  <option value="Failed" className="bg-[#081222] text-white">
                    Failed
                  </option>
                </select>
                {reportErrors.status ? (
                  <p className="text-sm text-rose-200">{reportErrors.status}</p>
                ) : null}
              </label>
            </div>
            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/58">
              <div className="flex items-center justify-between gap-3">
                <span>{transactionStageLabel}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                  {Math.max(0, Math.min(100, Math.round(reportTransactionProgress)))}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400"
                  animate={{ width: `${reportTransactionProgress}%` }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
              </div>
              <p className="mt-3 text-white/52">
                {buildReportSummary(reportForm.reportType, reportForm.exportFormat)}
              </p>
            </div>
            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                disabled={creatingReport}
                onClick={() => closeReportComposer(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-70"
                disabled={creatingReport}
              >
                {creatingReport ? <LoaderCircle className="size-4 animate-spin" /> : <Layers3 className="size-4" />}
                {editingReport ? "Save report" : "Start transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
