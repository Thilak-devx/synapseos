import type { Prisma } from "@prisma/client";
import type { DashboardSection, UserRole } from "@/types";
import type {
  ActivityFeedItem,
  ActivityTimelinePoint,
  DashboardSectionMeta,
  DashboardSnapshot,
  DbmsCapabilityCard,
  NotificationCenterItem,
  QueryAnalyticsRecord,
  ReportRecord,
  SystemMetricRecord,
  TransactionMonitorRecord,
  UserDirectoryRecord,
} from "@/features/dashboard/types";
import { isDatabaseConnectivityError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

const sectionMetaByRole: Record<UserRole, Record<DashboardSection, DashboardSectionMeta>> = {
  ADMIN: {
    overview: {
      section: "overview",
      eyebrow: "Executive command",
      title: "Enterprise command center",
      description:
        "Operate identity, reporting, infrastructure posture, and organization-wide health from one premium control plane.",
    },
    analytics: {
      section: "analytics",
      eyebrow: "Global intelligence",
      title: "Platform analytics",
      description:
        "Track global growth, throughput, and service saturation with admin-level visibility across all tenants and systems.",
    },
    reports: {
      section: "reports",
      eyebrow: "Reporting suite",
      title: "Global reports workspace",
      description:
        "Monitor executive reports, exports, delivery quality, and the health of every reporting pipeline.",
    },
    notifications: {
      section: "notifications",
      eyebrow: "Signal center",
      title: "Admin notifications",
      description:
        "Triaged incident, billing, workflow, and security signals routed to platform leadership.",
    },
    profile: {
      section: "profile",
      eyebrow: "Identity controls",
      title: "Admin profile",
      description:
        "Review account posture, avatar controls, and personal security preferences without leaving the command layer.",
    },
    departments: {
      section: "departments",
      eyebrow: "Org topology",
      title: "Departments",
      description:
        "Compare utilization, incident concentration, and leader accountability across departments.",
    },
    team: {
      section: "team",
      eyebrow: "Leadership lens",
      title: "Team visibility",
      description:
        "Monitor assigned team coverage, manager bandwidth, and human workload across critical functions.",
    },
    "activity-logs": {
      section: "activity-logs",
      eyebrow: "Audit trail",
      title: "Activity logs",
      description:
        "Inspect identity events, admin changes, report generation, and platform mutations in one audit stream.",
    },
    "system-metrics": {
      section: "system-metrics",
      eyebrow: "Runtime health",
      title: "System metrics",
      description:
        "Keep a tight pulse on CPU, memory, active sessions, database load, and latency across the control plane.",
    },
    settings: {
      section: "settings",
      eyebrow: "Global controls",
      title: "System settings",
      description:
        "Configure enterprise security, workflow automation, environment defaults, and cross-platform governance.",
    },
    users: {
      section: "users",
      eyebrow: "Identity governance",
      title: "User management",
      description:
        "Manage user lifecycle, role assignment, access policy, and department ownership with strict RBAC controls.",
    },
  },
  MANAGER: {
    overview: {
      section: "overview",
      eyebrow: "Department command",
      title: "Department dashboard",
      description:
        "See your team’s operational health, assigned reports, department readiness, and current workload in one focused surface.",
    },
    analytics: {
      section: "analytics",
      eyebrow: "Department insights",
      title: "Team analytics",
      description:
        "Review department productivity, response quality, and trendlines without exposing global admin metrics.",
    },
    reports: {
      section: "reports",
      eyebrow: "Managed reporting",
      title: "Assigned reports",
      description:
        "Create and monitor department reports, export status, and stakeholder-ready summaries for your scope.",
    },
    notifications: {
      section: "notifications",
      eyebrow: "Signal center",
      title: "Manager notifications",
      description:
        "Follow escalations, workflow updates, and team-facing alerts relevant to your department.",
    },
    profile: {
      section: "profile",
      eyebrow: "Identity controls",
      title: "Manager profile",
      description:
        "Update your avatar, profile details, password settings, and personal security configuration.",
    },
    departments: {
      section: "departments",
      eyebrow: "Department readiness",
      title: "Department overview",
      description:
        "Track utilization, coverage, and alert load across the teams and functions you oversee.",
    },
    team: {
      section: "team",
      eyebrow: "Assigned team",
      title: "Team workspace",
      description:
        "Monitor team data, workload posture, focus status, and recent collaboration events.",
    },
    "activity-logs": {
      section: "activity-logs",
      eyebrow: "Team activity",
      title: "Activity feed",
      description:
        "Watch login activity, report generation, and department-level operational events relevant to your team.",
    },
    "system-metrics": {
      section: "system-metrics",
      eyebrow: "Restricted",
      title: "Restricted metrics",
      description: "System metrics are reserved for administrators.",
    },
    settings: {
      section: "settings",
      eyebrow: "Account controls",
      title: "Manager settings",
      description:
        "Tune account preferences, notification routing, and personal security settings for your workspace.",
    },
    users: {
      section: "users",
      eyebrow: "Restricted",
      title: "Restricted users",
      description: "User administration is reserved for administrators.",
    },
  },
  USER: {
    overview: {
      section: "overview",
      eyebrow: "Personal workspace",
      title: "Personal dashboard",
      description:
        "Review your own performance, assigned reports, recent activity, notifications, and profile health with no admin controls exposed.",
    },
    analytics: {
      section: "analytics",
      eyebrow: "Personal insights",
      title: "Personal analytics",
      description:
        "View your own activity, report cadence, and focus trends without any department or platform-wide access.",
    },
    reports: {
      section: "reports",
      eyebrow: "Assigned work",
      title: "Assigned reports",
      description:
        "Access only the reports assigned to you and track their delivery state through a clean operator-friendly interface.",
    },
    notifications: {
      section: "notifications",
      eyebrow: "Inbox",
      title: "Notification center",
      description:
        "Monitor your personal alerts, workflow updates, and account-related notifications in realtime style.",
    },
    profile: {
      section: "profile",
      eyebrow: "Identity",
      title: "Profile settings",
      description:
        "Upload an avatar, update personal details, manage password changes, and keep your account secure.",
    },
    departments: {
      section: "departments",
      eyebrow: "Restricted",
      title: "Restricted departments",
      description: "Department oversight is limited to managers and administrators.",
    },
    team: {
      section: "team",
      eyebrow: "Restricted",
      title: "Restricted team",
      description: "Assigned team data is limited to managers and administrators.",
    },
    "activity-logs": {
      section: "activity-logs",
      eyebrow: "Restricted",
      title: "Restricted activity",
      description: "Organization-wide activity logs are limited to managers and administrators.",
    },
    "system-metrics": {
      section: "system-metrics",
      eyebrow: "Restricted",
      title: "Restricted metrics",
      description: "System metrics are reserved for administrators.",
    },
    settings: {
      section: "settings",
      eyebrow: "Account controls",
      title: "Account settings",
      description:
        "Manage your account preferences, security defaults, and notification routing with a premium personal settings surface.",
    },
    users: {
      section: "users",
      eyebrow: "Restricted",
      title: "Restricted users",
      description: "User management is reserved for administrators.",
    },
  },
};

const baseSnapshot: DashboardSnapshot = {
  kpis: [
    {
      label: "Total Users",
      value: 18420,
      change: "+12.4%",
      detail: "Net new identities in the last 30 days",
      trend: "up",
      glow: "from-cyan-400/25 via-sky-500/10 to-transparent",
      sparkline: [11, 13, 14, 16, 15, 18, 21],
    },
    {
      label: "Active Users",
      value: 9264,
      change: "+7.8%",
      detail: "Currently active across all managed workspaces",
      trend: "up",
      glow: "from-emerald-400/25 via-teal-500/10 to-transparent",
      sparkline: [42, 48, 45, 56, 61, 66, 70],
    },
    {
      label: "Reports Generated",
      value: 1284,
      change: "+19.2%",
      detail: "Completed exports during this billing cycle",
      trend: "up",
      glow: "from-fuchsia-400/25 via-violet-500/10 to-transparent",
      sparkline: [8, 10, 11, 15, 18, 19, 24],
    },
    {
      label: "Transactions/sec",
      value: 8420,
      suffix: "/s",
      change: "+4.1%",
      detail: "Sustained write throughput across primary clusters",
      trend: "up",
      glow: "from-amber-300/25 via-orange-500/10 to-transparent",
      sparkline: [55, 58, 57, 59, 61, 64, 66],
    },
    {
      label: "System Health",
      value: 99.982,
      suffix: "%",
      change: "+0.03%",
      detail: "Composite health index from infra and auth services",
      trend: "steady",
      glow: "from-indigo-400/25 via-blue-500/10 to-transparent",
      sparkline: [99, 99, 100, 100, 99, 100, 100],
    },
    {
      label: "Database Operations",
      value: 12480000,
      change: "+28.6%",
      detail: "Read/write operations across tenant workloads today",
      trend: "up",
      glow: "from-rose-400/25 via-pink-500/10 to-transparent",
      sparkline: [18, 24, 27, 33, 40, 46, 52],
    },
  ],
  chartSeries: [
    { label: "Jan", users: 11200, activeUsers: 6200, activities: 420, reports: 130, cpuUsage: 52, memoryUsage: 60, traffic: 12, latency: 180, focusScore: 74, teamVelocity: 71 },
    { label: "Feb", users: 12440, activeUsers: 6840, activities: 510, reports: 154, cpuUsage: 56, memoryUsage: 63, traffic: 14, latency: 174, focusScore: 76, teamVelocity: 75 },
    { label: "Mar", users: 13620, activeUsers: 7120, activities: 568, reports: 172, cpuUsage: 58, memoryUsage: 64, traffic: 16, latency: 168, focusScore: 79, teamVelocity: 77 },
    { label: "Apr", users: 14980, activeUsers: 7810, activities: 630, reports: 194, cpuUsage: 60, memoryUsage: 67, traffic: 19, latency: 161, focusScore: 81, teamVelocity: 82 },
    { label: "May", users: 16240, activeUsers: 8340, activities: 690, reports: 226, cpuUsage: 64, memoryUsage: 70, traffic: 22, latency: 154, focusScore: 84, teamVelocity: 86 },
    { label: "Jun", users: 17420, activeUsers: 8920, activities: 760, reports: 248, cpuUsage: 62, memoryUsage: 68, traffic: 24, latency: 149, focusScore: 86, teamVelocity: 89 },
    { label: "Jul", users: 18420, activeUsers: 9264, activities: 824, reports: 286, cpuUsage: 61, memoryUsage: 66, traffic: 27, latency: 142, focusScore: 89, teamVelocity: 92 },
  ],
  users: [
    { id: "USR-1042", name: "Ariana Kent", email: "ariana.kent@synapseos.dev", role: "ADMIN", department: "Platform", status: "Active", lastSeen: "2 min ago", avatar: "AK" },
    { id: "USR-1081", name: "Noah Bhatt", email: "noah.bhatt@synapseos.dev", role: "MANAGER", department: "Analytics", status: "Active", lastSeen: "9 min ago", avatar: "NB" },
    { id: "USR-1159", name: "Mila Torres", email: "mila.torres@synapseos.dev", role: "USER", department: "Security", status: "Provisioning", lastSeen: "Pending invite", avatar: "MT" },
    { id: "USR-1196", name: "Ethan Fischer", email: "ethan.fischer@synapseos.dev", role: "USER", department: "Finance", status: "Suspended", lastSeen: "3 days ago", avatar: "EF" },
    { id: "USR-1244", name: "Priya Raman", email: "priya.raman@synapseos.dev", role: "MANAGER", department: "Operations", status: "Active", lastSeen: "24 min ago", avatar: "PR" },
    { id: "USR-1291", name: "Jules Mercer", email: "jules.mercer@synapseos.dev", role: "USER", department: "Customer Ops", status: "Active", lastSeen: "1 hour ago", avatar: "JM" },
  ],
  activities: [
    { id: "LOG-9001", actor: "Ariana Kent", action: "Elevated role", resource: "Noah Bhatt -> Manager", timestamp: "Just now", severity: "Info", ipAddress: "10.14.2.41" },
    { id: "LOG-8997", actor: "System", action: "Generated report", resource: "Quarterly Compliance Summary", timestamp: "6 min ago", severity: "Info", ipAddress: "127.0.0.1" },
    { id: "LOG-8992", actor: "Security Sentinel", action: "Blocked login anomaly", resource: "Finance SSO Gateway", timestamp: "18 min ago", severity: "Critical", ipAddress: "185.77.21.14" },
    { id: "LOG-8984", actor: "Priya Raman", action: "Updated department policy", resource: "Operations Escalation Matrix", timestamp: "32 min ago", severity: "Warning", ipAddress: "10.14.8.12" },
    { id: "LOG-8975", actor: "System", action: "Scaled database replicas", resource: "eu-west primary cluster", timestamp: "1 hr ago", severity: "Info", ipAddress: "172.20.0.8" },
  ],
  notifications: [
    { id: "NOT-1", title: "Access policy drift detected", message: "Three production roles diverged from the approved RBAC template.", time: "2 min ago", read: false, category: "Security", href: "/dashboard/activity-logs", actionLabel: "View activity" },
    { id: "NOT-2", title: "Revenue operations export completed", message: "The Q2 board pack is ready for download in CSV and PDF formats.", time: "11 min ago", read: false, category: "Workflow", href: "/dashboard/reports", actionLabel: "Open reports" },
    { id: "NOT-3", title: "Database load spike normalized", message: "Primary transactional load returned below threshold after autoscaling.", time: "28 min ago", read: true, category: "Incident", href: "/dashboard/system-metrics", actionLabel: "View metrics" },
    { id: "NOT-4", title: "Enterprise billing checkpoint", message: "Forecasted usage remains 6.2% under the monthly budget guardrail.", time: "1 hr ago", read: true, category: "Billing", href: "/dashboard/notifications", actionLabel: "View notifications" },
  ],
  reports: [
    createReportRecord({ id: "RPT-2401", title: "Executive Usage Summary", type: "Executive Summary", owner: "Insights Bot", status: "Completed", generatedAt: "09:42 UTC", createdAt: "2026-05-24T09:42:00.000Z", exportFormat: "PDF", summary: "Board-ready usage report summarizing adoption, health posture, and revenue-facing momentum.", metrics: [{ label: "Active users", value: "9,264" }, { label: "Completion rate", value: "99.2%" }, { label: "Revenue workspaces", value: "128" }] }),
    createReportRecord({ id: "RPT-2402", title: "Department Incident Ledger", type: "Operational Ledger", owner: "Priya Raman", status: "Processing", generatedAt: "09:31 UTC", createdAt: "2026-05-24T09:31:00.000Z", exportFormat: "JSON", summary: "Structured incident ledger for department-level reconciliation and downstream system ingest.", metrics: [{ label: "Open incidents", value: "12" }, { label: "Escalated severity", value: "3 critical" }, { label: "Refresh cadence", value: "15 min" }] }),
    createReportRecord({ id: "RPT-2403", title: "RBAC Access Delta", type: "Audit Delta", owner: "Ariana Kent", status: "Completed", generatedAt: "08:54 UTC", createdAt: "2026-05-24T08:54:00.000Z", exportFormat: "CSV", summary: "Role and permission delta export prepared for security review and spreadsheet analysis.", metrics: [{ label: "Role changes", value: "18" }, { label: "Affected users", value: "11" }, { label: "Policy drifts", value: "0 unresolved" }] }),
    createReportRecord({ id: "RPT-2404", title: "Platform Cost Forecast", type: "Forecast Model", owner: "Finance Ops", status: "Queued", generatedAt: "08:40 UTC", createdAt: "2026-05-24T08:40:00.000Z", exportFormat: "PDF", summary: "Scenario-based infrastructure forecast prepared for finance and platform leadership review.", metrics: [{ label: "Projected spend", value: "$184k" }, { label: "Variance band", value: "±4.8%" }, { label: "Planning window", value: "90 days" }] }),
    createReportRecord({ id: "RPT-2405", title: "Tenant Latency Exceptions", type: "Exception Feed", owner: "Reliability", status: "Failed", generatedAt: "08:12 UTC", createdAt: "2026-05-24T08:12:00.000Z", exportFormat: "CSV", summary: "Latency exception feed retained in tabular format for quick triage and incident replay.", metrics: [{ label: "Impacted tenants", value: "7" }, { label: "p95 spikes", value: "142-188ms" }, { label: "Retry status", value: "Awaiting rerun" }] }),
  ],
  departments: [
    { id: "DEP-1", name: "Platform", lead: "Ariana Kent", headcount: 146, utilization: 82, openIncidents: 3 },
    { id: "DEP-2", name: "Operations", lead: "Priya Raman", headcount: 88, utilization: 76, openIncidents: 5 },
    { id: "DEP-3", name: "Security", lead: "Luca Moretti", headcount: 42, utilization: 91, openIncidents: 1 },
    { id: "DEP-4", name: "Analytics", lead: "Noah Bhatt", headcount: 57, utilization: 74, openIncidents: 2 },
  ],
  systemMetrics: [
    { id: "MET-1", label: "CPU usage", current: 61, unit: "%", threshold: 75, trend: [44, 48, 51, 59, 64, 63, 61] },
    { id: "MET-2", label: "Memory usage", current: 66, unit: "%", threshold: 78, trend: [52, 55, 57, 61, 69, 68, 66] },
    { id: "MET-3", label: "Active sessions", current: 4281, unit: "sessions", threshold: 5000, trend: [2800, 3100, 3400, 3890, 4010, 4170, 4281] },
    { id: "MET-4", label: "Database load", current: 14.2, unit: "GB", threshold: 18, trend: [9.2, 10.1, 10.7, 12.3, 13.5, 13.9, 14.2] },
    { id: "MET-5", label: "P95 latency", current: 142, unit: "ms", threshold: 180, trend: [186, 179, 172, 164, 158, 149, 142] },
  ],
  insights: [
    {
      title: "Authorization posture",
      description: "100% of privileged actions remain covered by middleware role gates and API checks.",
      stat: "0 unresolved policy drifts",
    },
    {
      title: "System throughput",
      description: "Transaction throughput climbed while latency continued downward, signaling healthy scaling behavior.",
      stat: "8420 tx/s at 142ms p95",
    },
    {
      title: "Department readiness",
      description: "Operations remains the highest alert surface, while Platform continues to carry the largest active footprint.",
      stat: "5 open operations incidents",
    },
  ],
  team: [
    { id: "TM-1", name: "Leah Soto", function: "Incident Commander", workload: "7 active items", status: "Online" },
    { id: "TM-2", name: "Dev Malhotra", function: "Automation Engineer", workload: "3 reviews", status: "Focus" },
    { id: "TM-3", name: "Nina Cole", function: "Reporting Analyst", workload: "Board pack draft", status: "Review" },
    { id: "TM-4", name: "Samir Das", function: "Security Liaison", workload: "2 escalations", status: "Online" },
  ],
  profile: {
    email: "admin@synapseos.dev",
    role: "ADMIN",
    department: "Platform",
    timezone: "UTC+05:30",
    securityScore: "98/100",
    avatarFallback: "SA",
  },
  dbmsCapabilities: [
    {
      title: "ACID transactions",
      description: "Registration, report generation, and role assignment run inside guarded Prisma transactions.",
      value: "3 flows protected",
      status: "Active",
    },
    {
      title: "Trigger automation",
      description: "Audit and notification workflows are simulated through resilient service fallbacks while local SQLite is active.",
      value: "SQLite fallback",
      status: "Fallback",
    },
    {
      title: "Stored procedures",
      description: "Analytics and summary procedures use PostgreSQL calls in production and Prisma aggregates in local development.",
      value: "Dual runtime path",
      status: "Active",
    },
    {
      title: "Referential integrity",
      description: "Users, roles, permissions, departments, reports, and notifications remain bound by relational constraints.",
      value: "FK-enforced",
      status: "Protected",
    },
  ],
  activityTimeline: [
    { id: "TL-1", label: "Login audit", value: "Credential session persisted", timestamp: "2 min ago", tone: "info" },
    { id: "TL-2", label: "Role mutation", value: "Manager access updated", timestamp: "14 min ago", tone: "warning" },
    { id: "TL-3", label: "Report transaction", value: "Queued reporting workflow committed", timestamp: "22 min ago", tone: "info" },
    { id: "TL-4", label: "Notification queue", value: "Unread signals routed for processing", timestamp: "40 min ago", tone: "critical" },
  ],
  queryAnalytics: [
    { label: "Identity lookups", value: 2840, change: "+12.4%" },
    { label: "Audit inserts", value: 918, change: "+8.1%" },
    { label: "Report writes", value: 406, change: "+17.9%" },
    { label: "Notification fanout", value: 1230, change: "+5.2%" },
  ],
  transactionMonitor: [
    { label: "Registration flow", state: "Healthy", detail: "User, role binding, notification, and audit records commit together." },
    { label: "Report generation", state: "Monitoring", detail: "Report creation, metric capture, and notification delivery are grouped transactionally." },
    { label: "Role assignment", state: "Guarded", detail: "Role changes emit activity and audit entries with rollback safety on failure." },
  ],
};

function cloneSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as DashboardSnapshot;
}

function formatRelativeTime(date: Date) {
  const diffInMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);
  return formatter.format(diffInDays, "day");
}

function mapNotificationCategory(type: string): NotificationCenterItem["category"] {
  if (type === "SECURITY" || type === "ACCESS") {
    return "Security";
  }

  if (type === "ACCOUNT") {
    return "Billing";
  }

  if (type === "REPORT") {
    return "Workflow";
  }

  return "Incident";
}

function mapNotificationHref(type: string, title: string): string {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("welcome")) {
    return "/dashboard#workspace-overview";
  }

  if (normalizedTitle.includes("seed")) {
    return "/dashboard/users#rbac-control-center";
  }

  if (type === "ACCESS" || type === "SECURITY") {
    return "/dashboard/activity-logs#audit-workspace";
  }

  if (type === "REPORT") {
    return "/dashboard/reports#reports-workspace";
  }

  if (type === "ACCOUNT") {
    return "/dashboard/profile#profile-controls";
  }

  return "/dashboard/notifications#notification-center";
}

function mapNotificationActionLabel(type: string, title: string): string {
  const href = mapNotificationHref(type, title);

  if (href.startsWith("/dashboard#")) {
    return "Open workspace";
  }

  if (href.startsWith("/dashboard/users")) {
    return "Open RBAC";
  }

  if (href.startsWith("/dashboard/activity-logs")) {
    return "View activity";
  }

  if (href.startsWith("/dashboard/reports")) {
    return "Open reports";
  }

  if (href.startsWith("/dashboard/profile")) {
    return "Open profile";
  }

  return "View notifications";
}

function mapReportStatus(status: string): ReportRecord["status"] {
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

function mapReportExportFormat(status: string): ReportRecord["exportFormat"] {
  if (status === "COMPLETED") {
    return "PDF";
  }

  if (status === "FAILED") {
    return "CSV";
  }

  return "JSON";
}

function buildReportAnalytics(input: {
  title: string;
  status: ReportRecord["status"];
  type: string;
}) {
  const seed = input.title.length + input.type.length;

  return {
    rowsAnalyzed: 1800 + seed * 42,
    executionDurationMs:
      input.status === "Completed"
        ? 840 + seed * 8
        : input.status === "Failed"
          ? 1620 + seed * 11
          : 1280 + seed * 9,
    transactionCount:
      input.status === "Completed" ? 14 + (seed % 6) : 8 + (seed % 5),
    dbLoad:
      input.status === "Archived"
        ? "6.8 GB"
        : input.status === "Failed"
          ? "14.1 GB"
          : `${(8.4 + (seed % 7) * 0.9).toFixed(1)} GB`,
    securityChecks:
      input.status === "Failed" ? "4 of 5 passed" : "5 of 5 passed",
    anomalyScore:
      input.status === "Failed"
        ? 78
        : input.status === "Processing"
          ? 42
          : input.status === "Archived"
            ? 15
            : 23,
  };
}

function buildReportPreview(input: {
  exportFormat: ReportRecord["exportFormat"];
  owner: string;
  status: ReportRecord["status"];
  title: string;
  type: string;
}) {
  const highlights = [
    `${input.type} workflow bound to ${input.exportFormat} delivery`,
    `${input.status} state mirrored across reporting analytics and audit surfaces`,
    `Prepared for ${input.owner} with SynapseOS compliance-grade metadata`,
  ];

  if (input.exportFormat === "CSV") {
    return {
      columns: ["Segment", "Rows", "Delta", "Owner"],
      rows: [
        ["North America", "1284", "+12.4%", input.owner],
        ["EMEA", "942", "+8.1%", input.owner],
        ["APAC", "1106", "+10.2%", input.owner],
      ],
      highlights,
    };
  }

  if (input.exportFormat === "JSON") {
    return {
      json: {
        reportType: input.type,
        owner: input.owner,
        status: input.status,
        delivery: input.exportFormat,
        regions: ["us-east-1", "eu-central-1", "ap-south-1"],
        controls: {
          auditReady: true,
          encrypted: true,
          shareable: input.status === "Completed" || input.status === "Archived",
        },
      },
      highlights,
    };
  }

  return {
    highlights,
  };
}

function buildReportActivityHistory(input: {
  id: string;
  owner: string;
  status: ReportRecord["status"];
}) {
  return [
    {
      id: `${input.id}-created`,
      action: "Report created",
      actor: input.owner,
      timestamp: "Just now",
      detail: "Initial transaction opened and report metadata persisted.",
    },
    {
      id: `${input.id}-validated`,
      action: "Security validated",
      actor: "Policy Engine",
      timestamp: "2 min ago",
      detail: "RBAC scope, schema constraints, and export posture passed validation.",
    },
    {
      id: `${input.id}-delivery`,
      action:
        input.status === "Archived"
          ? "Report archived"
          : input.status === "Failed"
            ? "Delivery interrupted"
            : "Export channel prepared",
      actor: "SynapseOS",
      timestamp: "5 min ago",
      detail:
        input.status === "Failed"
          ? "The reporting queue flagged a delivery interruption for operator review."
          : "The report is ready for preview, export, and downstream compliance workflows.",
    },
  ];
}

function buildReportMetadata(input: {
  exportFormat?: ReportRecord["exportFormat"];
  owner?: string;
  status: ReportRecord["status"];
  title: string;
  type?: string;
}) {
  const summary =
    input.status === "Archived"
      ? `${input.title} was archived after distribution and remains available for audit playback.`
      : input.status === "Completed"
      ? `${input.title} is finalized and presentation-ready for enterprise distribution.`
      : input.status === "Failed"
        ? `${input.title} encountered pipeline issues and is exported as diagnostic tabular data for remediation.`
        : `${input.title} remains a structured in-flight workflow export designed for downstream systems and auditability.`;

  return {
    summary,
    metrics: [
      {
        label: "Workflow status",
        value: input.status,
      },
      {
        label: "Dataset class",
        value:
          input.status === "Completed"
            ? "Executive summary"
            : input.status === "Failed"
              ? "Diagnostic extract"
              : "Operational payload",
      },
      {
        label: "Delivery tier",
        value:
          input.status === "Archived"
            ? "Historical archive"
            : input.status === "Completed"
            ? "Board distribution"
            : input.status === "Failed"
              ? "Engineering review"
              : "Realtime sync",
      },
      {
        label: "Owner scope",
        value: input.owner ?? "SynapseOS operator",
      },
      {
        label: "Export channel",
        value: input.exportFormat ?? "JSON",
      },
    ],
  };
}

function createReportRecord(input: {
  id: string;
  title: string;
  type: string;
  owner: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  status: ReportRecord["status"];
  generatedAt: string;
  createdAt: string;
  exportFormat: ReportRecord["exportFormat"];
  isArchived?: boolean;
  lastActiveStatus?: ReportRecord["lastActiveStatus"];
  ownerScope?: string;
  summary?: string;
  metrics?: ReportRecord["metrics"];
}) {
  const metadata = buildReportMetadata({
    exportFormat: input.exportFormat,
    owner: input.owner,
    status: input.status,
    title: input.title,
    type: input.type,
  });
  const analytics = buildReportAnalytics({
    title: input.title,
    status: input.status,
    type: input.type,
  });
  const preview = buildReportPreview({
    exportFormat: input.exportFormat,
    owner: input.owner,
    status: input.status,
    title: input.title,
    type: input.type,
  });

  return {
    id: input.id,
    title: input.title,
    type: input.type,
    owner: input.owner,
    archivedAt: input.archivedAt ?? null,
    deletedAt: input.deletedAt ?? null,
    isArchived: input.isArchived ?? input.status === "Archived",
    lastActiveStatus:
      input.lastActiveStatus ??
      (input.status === "Archived" ? "Completed" : input.status),
    status: input.status,
    generatedAt: input.generatedAt,
    createdAt: input.createdAt,
    exportFormat: input.exportFormat,
    transactionId: input.id,
    ownerScope: input.ownerScope ?? "Global workspace",
    metrics: input.metrics ?? metadata.metrics,
    analytics,
    preview,
    activityHistory: buildReportActivityHistory({
      id: input.id,
      owner: input.owner,
      status: input.status,
    }),
    metadata: {
      summary: input.summary ?? metadata.summary,
      metrics: input.metrics ?? metadata.metrics,
    },
  } satisfies ReportRecord;
}

function mapActivitySeverity(action: string): ActivityFeedItem["severity"] {
  const normalizedAction = action.toLowerCase();

  if (normalizedAction.includes("delete") || normalizedAction.includes("blocked")) {
    return "Critical";
  }

  if (normalizedAction.includes("role") || normalizedAction.includes("report")) {
    return "Warning";
  }

  return "Info";
}

function mapTimelineTone(action: string): ActivityTimelinePoint["tone"] {
  const severity = mapActivitySeverity(action);
  if (severity === "Critical") return "critical";
  if (severity === "Warning") return "warning";
  return "info";
}

function mapDbmsStatus(label: string): DbmsCapabilityCard["status"] {
  if (label.toLowerCase().includes("trigger")) {
    return "Fallback";
  }
  if (label.toLowerCase().includes("integrity")) {
    return "Protected";
  }
  return "Active";
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function getBaseDashboardSnapshotForRole(role: UserRole): DashboardSnapshot {
  const snapshot = cloneSnapshot(baseSnapshot);

  if (role === "ADMIN") {
    snapshot.profile = {
      email: "admin@synapseos.dev",
      role: "ADMIN",
      department: "Platform Engineering",
      timezone: "UTC+05:30",
      securityScore: "98/100",
      avatarFallback: "AD",
    };
    return snapshot;
  }

  if (role === "MANAGER") {
    snapshot.kpis = [
      {
        label: "Department Health",
        value: 94,
        suffix: "%",
        change: "+5.2%",
        detail: "Composite readiness across the assigned department",
        trend: "up",
        glow: "from-cyan-400/25 via-sky-500/10 to-transparent",
        sparkline: [61, 64, 67, 72, 78, 84, 94],
      },
      {
        label: "Team Velocity",
        value: 92,
        suffix: "%",
        change: "+3.4%",
        detail: "Resolved work against planned capacity",
        trend: "up",
        glow: "from-emerald-400/25 via-teal-500/10 to-transparent",
        sparkline: [55, 58, 64, 68, 74, 86, 92],
      },
      {
        label: "Assigned Reports",
        value: 18,
        change: "+4 this week",
        detail: "Open or active reporting workflows in your department",
        trend: "up",
        glow: "from-fuchsia-400/25 via-violet-500/10 to-transparent",
        sparkline: [4, 5, 7, 9, 12, 14, 18],
      },
      {
        label: "Open Escalations",
        value: 5,
        change: "-2 from last week",
        detail: "Department issues awaiting final closure",
        trend: "steady",
        glow: "from-amber-300/25 via-orange-500/10 to-transparent",
        sparkline: [9, 8, 8, 7, 6, 5, 5],
      },
    ];
    snapshot.users = snapshot.users.filter((user) => user.department === "Operations" || user.department === "Analytics");
    snapshot.reports = snapshot.reports.slice(0, 3);
    snapshot.systemMetrics = [];
    snapshot.profile = {
      email: "manager@synapseos.dev",
      role: "MANAGER",
      department: "Operations",
      timezone: "UTC+05:30",
      securityScore: "93/100",
      avatarFallback: "MG",
    };
    snapshot.insights = [
      {
        title: "Department readiness",
        description: "Escalations are trending downward while delivery velocity improved through the last reporting cycle.",
        stat: "5 open escalations",
      },
      {
        title: "Team utilization",
        description: "Workload is balanced, though reporting analysts are carrying the heaviest active queue.",
        stat: "92% team velocity",
      },
      {
        title: "Manager permissions",
        description: "Global metrics and admin settings remain restricted despite analytics access in your own department scope.",
        stat: "No unrestricted admin access",
      },
    ];
    return snapshot;
  }

  snapshot.kpis = [
    {
      label: "Personal Focus",
      value: 91,
      suffix: "%",
      change: "+2.8%",
      detail: "Your recent execution focus score",
      trend: "up",
      glow: "from-cyan-400/25 via-sky-500/10 to-transparent",
      sparkline: [62, 68, 71, 76, 82, 86, 91],
    },
    {
      label: "Assigned Reports",
      value: 6,
      change: "+1 today",
      detail: "Reports currently assigned to you",
      trend: "up",
      glow: "from-emerald-400/25 via-teal-500/10 to-transparent",
      sparkline: [1, 2, 2, 3, 4, 5, 6],
    },
    {
      label: "Notifications",
      value: 4,
      change: "2 unread",
      detail: "New items in your notification center",
      trend: "steady",
      glow: "from-fuchsia-400/25 via-violet-500/10 to-transparent",
      sparkline: [2, 2, 3, 3, 4, 4, 4],
    },
    {
      label: "Security Score",
      value: 96,
      suffix: "%",
      change: "Strong",
      detail: "Account posture based on session and credential hygiene",
      trend: "steady",
      glow: "from-amber-300/25 via-orange-500/10 to-transparent",
      sparkline: [91, 92, 93, 93, 94, 95, 96],
    },
  ];
  snapshot.users = [];
  snapshot.departments = [];
  snapshot.systemMetrics = [];
  snapshot.team = [];
  snapshot.reports = [
    createReportRecord({ id: "RPT-USER-1", title: "Weekly Pipeline Summary", type: "Executive Summary", owner: "Assigned to you", status: "Completed", generatedAt: "Today - 09:10", createdAt: "2026-05-24T09:10:00.000Z", exportFormat: "PDF", ownerScope: "Personal workspace", summary: "Personal performance summary prepared for a polished presentation export.", metrics: [{ label: "Assigned scope", value: "6 pipelines" }, { label: "Completion rate", value: "94%" }, { label: "Review mode", value: "Stakeholder-ready" }] }),
    createReportRecord({ id: "RPT-USER-2", title: "Revenue Readiness Review", type: "Operational Review", owner: "Assigned to you", status: "Processing", generatedAt: "Today - 08:52", createdAt: "2026-05-24T08:52:00.000Z", exportFormat: "JSON", ownerScope: "Personal workspace", summary: "Machine-readable operational review still syncing downstream readiness checkpoints.", metrics: [{ label: "Pipeline state", value: "Processing" }, { label: "Systems attached", value: "4" }, { label: "Next checkpoint", value: "08:58 UTC" }] }),
    createReportRecord({ id: "RPT-USER-3", title: "Notification Hygiene Audit", type: "Audit Extract", owner: "Assigned to you", status: "Queued", generatedAt: "Yesterday - 17:20", createdAt: "2026-05-23T17:20:00.000Z", exportFormat: "CSV", ownerScope: "Personal workspace", summary: "Tabular notification audit designed for spreadsheet review and historical comparison.", metrics: [{ label: "Unread reviewed", value: "42" }, { label: "Alert classes", value: "4" }, { label: "Pending export", value: "Queued" }] }),
  ];
  snapshot.activities = [
    { id: "ACT-1", actor: "You", action: "Completed review", resource: "Weekly Pipeline Summary", timestamp: "8 min ago", severity: "Info", ipAddress: "10.14.5.23" },
    { id: "ACT-2", actor: "You", action: "Updated profile", resource: "Security preferences", timestamp: "41 min ago", severity: "Info", ipAddress: "10.14.5.23" },
    { id: "ACT-3", actor: "System", action: "Queued report", resource: "Revenue Readiness Review", timestamp: "1 hr ago", severity: "Warning", ipAddress: "127.0.0.1" },
  ];
  snapshot.notifications = [
    { id: "USER-NOT-1", title: "Assigned report updated", message: "Revenue Readiness Review moved to processing.", time: "6 min ago", read: false, category: "Workflow", href: "/dashboard/reports", actionLabel: "Open reports" },
    { id: "USER-NOT-2", title: "Security reminder", message: "Your password review window opens in 3 days.", time: "1 hr ago", read: false, category: "Security", href: "/dashboard/profile", actionLabel: "Open profile" },
    { id: "USER-NOT-3", title: "Profile sync complete", message: "Your recent profile changes are now reflected across SynapseOS.", time: "Yesterday", read: true, category: "Workflow", href: "/dashboard/profile", actionLabel: "Open profile" },
  ];
  snapshot.profile = {
    email: "user@synapseos.dev",
    role: "USER",
    department: "Customer Ops",
    timezone: "UTC+05:30",
    securityScore: "96/100",
    avatarFallback: "US",
  };
  snapshot.insights = [
    {
      title: "Personal performance",
      description: "Your focus and report completion trends remain healthy without exposing any team or system data.",
      stat: "91% focus score",
    },
    {
      title: "Assigned workload",
      description: "Your queue is balanced and currently limited to six active or pending report workflows.",
      stat: "6 assigned reports",
    },
    {
      title: "Access posture",
      description: "Admin dashboard, system metrics, user management, and role controls remain blocked for this account.",
      stat: "Restricted by middleware and server guards",
    },
  ];
  return snapshot;
}

export async function getDashboardSnapshotForRole(
  role: UserRole,
  context?: {
    userEmail?: string | null;
    userId?: string;
    userName?: string | null;
  },
): Promise<DashboardSnapshot> {
  const snapshot = getBaseDashboardSnapshotForRole(role);

  if (!context?.userId) {
    return snapshot;
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: context.userId },
      include: {
        department: true,
        role: true,
      },
    });

    if (currentUser) {
      snapshot.profile = {
        ...snapshot.profile,
        email: currentUser.email,
        role: currentUser.role.name as UserRole,
        department: currentUser.department?.name ?? snapshot.profile.department,
        avatarFallback:
          currentUser.name
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || snapshot.profile.avatarFallback,
      };
    }

    const [personalNotifications, personalReports, personalActivities] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.report.findMany({
        where:
          role === "ADMIN"
            ? undefined
            : {
                OR: [{ assignedToId: context.userId }, { generatedById: context.userId }],
              },
        include: {
          assignedTo: {
            select: {
              name: true,
            },
          },
          generatedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.activityLog.findMany({
        where: role === "ADMIN" ? undefined : { userId: context.userId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    snapshot.notifications = personalNotifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      time: formatRelativeTime(notification.createdAt),
      read: notification.isRead,
      category: mapNotificationCategory(notification.type),
      href: notification.href ?? mapNotificationHref(notification.type, notification.title),
      actionLabel:
        notification.actionLabel ??
        mapNotificationActionLabel(notification.type, notification.title),
    }));

    snapshot.reports = personalReports.map((report) =>
      createReportRecord({
        id: report.id,
        title: report.title,
        type: report.reportType,
        owner:
          report.ownerLabel ??
          report.generatedBy?.name ??
          report.assignedTo?.name ??
          context.userName ??
          "SynapseOS",
        status: report.isArchived ? "Archived" : mapReportStatus(report.status),
        createdAt: report.createdAt.toISOString(),
        generatedAt: report.createdAt.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        archivedAt: report.archivedAt?.toISOString() ?? null,
        deletedAt: report.deletedAt?.toISOString() ?? null,
        exportFormat:
          report.exportFormat === "PDF" ||
          report.exportFormat === "CSV" ||
          report.exportFormat === "JSON"
            ? report.exportFormat
            : mapReportExportFormat(report.status),
        isArchived: report.isArchived,
        lastActiveStatus: (() => {
          const activeStatus = mapReportStatus(report.status);
          return report.isArchived && activeStatus !== "Archived"
            ? activeStatus
            : undefined;
        })(),
        ownerScope:
          report.ownerScope ??
          (role === "ADMIN"
            ? "Global workspace"
            : role === "MANAGER"
              ? "Department workspace"
              : "Personal workspace"),
        summary: report.summary ?? undefined,
        metrics: Array.isArray(report.metrics)
          ? (report.metrics as ReportRecord["metrics"])
          : undefined,
      }),
    );

    snapshot.activities = personalActivities.map((activity) => ({
      id: activity.id,
      actor: activity.user?.name ?? "System",
      action: activity.action,
      resource: activity.entityType
        ? `${activity.entityType}${activity.entityId ? ` ${activity.entityId}` : ""}`
        : "SynapseOS action",
      timestamp: formatRelativeTime(activity.createdAt),
      severity: mapActivitySeverity(activity.action),
      ipAddress: activity.ipAddress ?? "127.0.0.1",
    }));

    snapshot.activityTimeline = personalActivities.slice(0, 4).map((activity) => ({
      id: activity.id,
      label: activity.action,
      value: activity.entityType
        ? `${activity.entityType}${activity.entityId ? ` ${activity.entityId}` : ""}`
        : "Database event",
      timestamp: formatRelativeTime(activity.createdAt),
      tone: mapTimelineTone(activity.action),
    }));

    if (role === "ADMIN") {
      const [userCount, activeUserCount, reportCount, latestMetrics, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { status: "ACTIVE" },
        }),
        prisma.report.count(),
        prisma.systemMetric.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.user.findMany({
          include: {
            department: true,
            role: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ]);

      snapshot.users = users.map<UserDirectoryRecord>((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name as UserRole,
        department: user.department?.name ?? "Unassigned",
        status:
          user.status === "SUSPENDED"
            ? "Suspended"
            : user.status === "INVITED"
              ? "Provisioning"
              : "Active",
        lastSeen: formatRelativeTime(user.updatedAt),
        avatar:
          user.name
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "SO",
      }));

      const metricSource = latestMetrics[0];

      snapshot.kpis[0] = {
        ...snapshot.kpis[0],
        value: userCount,
        detail: "Provisioned identities recorded in PostgreSQL",
      };
      snapshot.kpis[1] = {
        ...snapshot.kpis[1],
        value: activeUserCount,
        detail: "Currently active accounts based on the persisted user status",
      };
      snapshot.kpis[2] = {
        ...snapshot.kpis[2],
        value: reportCount,
        detail: "Reports stored in the reporting workflow table",
      };

      if (metricSource) {
        snapshot.kpis[3] = {
          ...snapshot.kpis[3],
          value: metricSource.activeUsers,
          suffix: "/active",
          detail: "Latest active-session signal from persisted system metrics",
        };

        snapshot.systemMetrics = [
          {
            id: `${metricSource.id}-cpu`,
            label: "CPU usage",
            current: toNumber(metricSource.cpuUsage),
            unit: "%",
            threshold: 75,
            trend: latestMetrics.map((metric) => toNumber(metric.cpuUsage)).reverse(),
          },
          {
            id: `${metricSource.id}-memory`,
            label: "Memory usage",
            current: toNumber(metricSource.memoryUsage),
            unit: "%",
            threshold: 80,
            trend: latestMetrics.map((metric) => toNumber(metric.memoryUsage)).reverse(),
          },
          {
            id: `${metricSource.id}-sessions`,
            label: "Active sessions",
            current: metricSource.activeUsers,
            unit: "sessions",
            threshold: 5000,
            trend: latestMetrics.map((metric) => metric.activeUsers).reverse(),
          },
          {
            id: `${metricSource.id}-database`,
            label: "Database load",
            current: toNumber(metricSource.databaseLoad),
            unit: "GB",
            threshold: 18,
            trend: latestMetrics.map((metric) => toNumber(metric.databaseLoad)).reverse(),
          },
        ] satisfies SystemMetricRecord[];
      }

      snapshot.queryAnalytics = [
        {
          label: "User queries",
          value: userCount,
          change: `${activeUserCount} active`,
        },
        {
          label: "Report writes",
          value: reportCount,
          change: `${snapshot.reports.filter((report) => report.status === "Completed").length} completed`,
        },
        {
          label: "Audit inserts",
          value: snapshot.activities.length,
          change: `${snapshot.activities.filter((activity) => activity.severity !== "Info").length} flagged`,
        },
        {
          label: "Metric samples",
          value: latestMetrics.length,
          change: metricSource ? `${toNumber(metricSource.databaseLoad).toFixed(1)}GB load` : "No load data",
        },
      ] satisfies QueryAnalyticsRecord[];
    } else {
      snapshot.kpis[1] = {
        ...snapshot.kpis[1],
        value: snapshot.reports.length,
        change: `${snapshot.reports.filter((report) => report.status === "Queued").length} queued`,
      };
      snapshot.kpis[2] = {
        ...snapshot.kpis[2],
        value: snapshot.notifications.length,
        change: `${snapshot.notifications.filter((notification) => !notification.read).length} unread`,
      };

      snapshot.queryAnalytics = [
        {
          label: "Assigned reports",
          value: snapshot.reports.length,
          change: `${snapshot.reports.filter((report) => report.status === "Processing").length} processing`,
        },
        {
          label: "Notification lookups",
          value: snapshot.notifications.length,
          change: `${snapshot.notifications.filter((notification) => !notification.read).length} unread`,
        },
        {
          label: role === "MANAGER" ? "Team activities" : "Profile events",
          value: snapshot.activities.length,
          change: role === "MANAGER" ? "Department scoped" : "Personal scoped",
        },
        {
          label: "Access checks",
          value: role === "MANAGER" ? 6 : 4,
          change: "RBAC enforced",
        },
      ] satisfies QueryAnalyticsRecord[];
    }

    snapshot.transactionMonitor = [
      {
        label: "Registration flow",
        state: "Healthy",
        detail: "Credentials, role linkage, notifications, and audit events remain wrapped in a single transaction.",
      },
      {
        label: "Report pipeline",
        state: role === "ADMIN" ? "Monitoring" : "Healthy",
        detail: "Reports persist with associated system metrics and downstream notifications.",
      },
      {
        label: "Role changes",
        state: role === "ADMIN" ? "Guarded" : "Healthy",
        detail: role === "ADMIN"
          ? "High-privilege access changes require protected server routes and transactional audit writes."
          : "Role escalation remains blocked by middleware and server guards for this account.",
      },
    ] satisfies TransactionMonitorRecord[];

    snapshot.dbmsCapabilities = [
      {
        title: "Transactions",
        description: "Critical writes are grouped through Prisma transactions for rollback safety.",
        value: role === "ADMIN" ? "Registration, reports, role changes" : "Profile-safe write flows",
        status: "Active",
      },
      {
        title: "Stored procedures",
        description: "Analytics endpoints switch between PostgreSQL procedures and local Prisma aggregates.",
        value: role === "ADMIN" ? "Admin analytics online" : "Scoped analytics online",
        status: "Active",
      },
      {
        title: "Triggers and audit",
        description: "Audit visibility is surfaced through ActivityLog and AuditEvent records powering the dashboard feed.",
        value: `${snapshot.activities.length} recent events`,
        status: mapDbmsStatus("triggers and audit"),
      },
      {
        title: "Referential integrity",
        description: "Role, department, report, and notification relationships remain attached to persisted users.",
        value: currentUser?.department?.name ?? "Relational links active",
        status: "Protected",
      },
    ];

    return snapshot;
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) {
      console.error(error);
    }

    return snapshot;
  }
}

export function getDashboardSectionMeta(
  role: UserRole,
  section: DashboardSection,
): DashboardSectionMeta {
  return sectionMetaByRole[role][section];
}
