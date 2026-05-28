import type { DashboardSection, UserRole } from "@/types";

export type DashboardKpi = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change: string;
  detail: string;
  trend: "up" | "down" | "steady";
  glow: string;
  sparkline: number[];
};

export type DashboardChartPoint = {
  label: string;
  users?: number;
  activeUsers?: number;
  activities: number;
  reports: number;
  cpuUsage?: number;
  memoryUsage?: number;
  traffic?: number;
  latency?: number;
  focusScore?: number;
  teamVelocity?: number;
};

export type UserDirectoryRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "Active" | "Provisioning" | "Suspended";
  lastSeen: string;
  avatar: string;
};

export type ActivityFeedItem = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  severity: "Info" | "Warning" | "Critical";
  ipAddress: string;
};

export type NotificationCenterItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: "Incident" | "Security" | "Billing" | "Workflow";
  href: string;
  actionLabel: string;
};

export type DepartmentSnapshot = {
  id: string;
  name: string;
  lead: string;
  headcount: number;
  utilization: number;
  openIncidents: number;
};

export type TeamMemberRecord = {
  id: string;
  name: string;
  function: string;
  workload: string;
  status: "Online" | "Focus" | "Review";
};

export type ReportRecord = {
  id: string;
  title: string;
  type: string;
  owner: string;
  lastActiveStatus?: "Draft" | "Completed" | "Processing" | "Queued" | "Failed";
  status: "Draft" | "Completed" | "Processing" | "Queued" | "Failed" | "Archived";
  generatedAt: string;
  createdAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  exportFormat: "PDF" | "CSV" | "JSON";
  isArchived?: boolean;
  transactionId?: string;
  ownerScope?: string;
  metrics?: Array<{
    label: string;
    value: string;
  }>;
  analytics: {
    rowsAnalyzed: number;
    executionDurationMs: number;
    transactionCount: number;
    dbLoad: string;
    securityChecks: string;
    anomalyScore: number;
  };
  preview: {
    columns?: string[];
    rows?: string[][];
    json?: Record<string, unknown>;
    highlights: string[];
  };
  activityHistory: Array<{
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    detail: string;
  }>;
  metadata: {
    summary: string;
    metrics: Array<{
      label: string;
      value: string;
    }>;
  };
};

export type SystemMetricRecord = {
  id: string;
  label: string;
  current: number;
  unit: "%" | "ms" | "GB" | "sessions";
  threshold: number;
  trend: number[];
};

export type DashboardInsight = {
  title: string;
  description: string;
  stat: string;
};

export type DbmsCapabilityCard = {
  title: string;
  description: string;
  value: string;
  status: "Active" | "Fallback" | "Protected";
};

export type ActivityTimelinePoint = {
  id: string;
  label: string;
  value: string;
  timestamp: string;
  tone: "info" | "warning" | "critical";
};

export type QueryAnalyticsRecord = {
  label: string;
  value: number;
  change: string;
};

export type TransactionMonitorRecord = {
  label: string;
  state: "Healthy" | "Monitoring" | "Guarded";
  detail: string;
};

export type DashboardSectionMeta = {
  section: DashboardSection;
  eyebrow: string;
  title: string;
  description: string;
};

export type ProfileCard = {
  email: string;
  role: UserRole;
  department: string;
  timezone: string;
  securityScore: string;
  avatarFallback: string;
};

export type DashboardSnapshot = {
  kpis: DashboardKpi[];
  chartSeries: DashboardChartPoint[];
  users: UserDirectoryRecord[];
  activities: ActivityFeedItem[];
  notifications: NotificationCenterItem[];
  reports: ReportRecord[];
  departments: DepartmentSnapshot[];
  systemMetrics: SystemMetricRecord[];
  insights: DashboardInsight[];
  team: TeamMemberRecord[];
  profile: ProfileCard;
  dbmsCapabilities: DbmsCapabilityCard[];
  activityTimeline: ActivityTimelinePoint[];
  queryAnalytics: QueryAnalyticsRecord[];
  transactionMonitor: TransactionMonitorRecord[];
};

export type AiCommandCenterContext = {
  activities: ActivityFeedItem[];
  anomalyScore: number;
  health: Array<{
    label: string;
    value: string;
    state: "Stable" | "Monitoring" | "Attention";
  }>;
  insights: DashboardInsight[];
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  notifications: NotificationCenterItem[];
  reports: ReportRecord[];
  role: UserRole;
  throughput: number;
  users: UserDirectoryRecord[];
};
