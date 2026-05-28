import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getDashboardSnapshotForRole } from "@/services/dashboard.service";
import type { AiCommandCenterContext } from "@/features/dashboard/types";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "/dashboard";
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const snapshot = await getDashboardSnapshotForRole(session.user.role, {
    userEmail: session.user.email,
    userId: session.user.id,
    userName: session.user.name,
  });
  const searchItems = [
    ...snapshot.users.map((user) => ({
      id: `user-${user.id}`,
      label: user.name,
      description: `${user.role} · ${user.email} · ${user.department}`,
      href: "/dashboard/users",
      category: "User",
      keywords: `${user.role} ${user.email} ${user.department} ${user.status}`,
    })),
    ...snapshot.reports.map((report) => ({
      id: `report-${report.id}`,
      label: report.title,
      description: `${report.owner} · ${report.status} · ${report.exportFormat}`,
      href: "/dashboard/reports",
      category: "Report",
      keywords: `${report.id} ${report.type} ${report.status} ${report.owner}`,
    })),
    ...snapshot.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      label: `${activity.actor} ${activity.action}`,
      description: `${activity.resource} · ${activity.timestamp}`,
      href: "/dashboard/activity-logs",
      category: "Activity",
      keywords: `${activity.actor} ${activity.action} ${activity.resource} ${activity.ipAddress}`,
    })),
    ...snapshot.departments.map((department) => ({
      id: `department-${department.id}`,
      label: department.name,
      description: `${department.lead} · ${department.headcount} team members`,
      href: "/dashboard/departments",
      category: "Department",
      keywords: `${department.lead} ${department.headcount} ${department.utilization}`,
    })),
    ...snapshot.notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      label: notification.title,
      description: notification.message,
      href: notification.href,
      category: "Notification",
      keywords: `${notification.category} ${notification.message} ${notification.time}`,
    })),
  ];
  const latestChartPoint = snapshot.chartSeries.at(-1);
  const anomalyScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (latestChartPoint?.latency ?? 120) / 6 +
          snapshot.activities.filter((activity) => activity.severity !== "Info").length * 6,
      ),
    ),
  );
  const aiContext: AiCommandCenterContext = {
    activities: snapshot.activities.slice(0, 12),
    anomalyScore,
    health: [
      {
        label: "DB health",
        value: `${Math.max(92, 100 - Math.round(anomalyScore / 8))}%`,
        state: anomalyScore > 60 ? "Attention" : anomalyScore > 32 ? "Monitoring" : "Stable",
      },
      {
        label: "Uptime",
        value: "99.982%",
        state: "Stable",
      },
      {
        label: "Queue depth",
        value: `${snapshot.notifications.filter((notification) => !notification.read).length + snapshot.reports.filter((report) => report.status === "Queued").length}`,
        state: snapshot.reports.some((report) => report.status === "Failed") ? "Attention" : "Monitoring",
      },
      {
        label: "Replication",
        value: "Synced",
        state: "Stable",
      },
      {
        label: "Throughput",
        value: `${snapshot.queryAnalytics.reduce((total, item) => total + item.value, 0).toLocaleString("en-US")} ops`,
        state: "Stable",
      },
      {
        label: "Anomaly score",
        value: `${anomalyScore}`,
        state: anomalyScore > 60 ? "Attention" : anomalyScore > 32 ? "Monitoring" : "Stable",
      },
    ],
    insights: snapshot.insights,
    metrics: snapshot.kpis.map((kpi) => ({
      label: kpi.label,
      value: `${kpi.prefix ?? ""}${kpi.value.toLocaleString("en-US")}${kpi.suffix ?? ""}`,
      detail: kpi.detail,
    })),
    notifications: snapshot.notifications.slice(0, 8),
    reports: snapshot.reports.slice(0, 12),
    role: session.user.role,
    throughput: snapshot.queryAnalytics.reduce((total, item) => total + item.value, 0),
    users: snapshot.users.slice(0, 12),
  };

  return (
    <DashboardShell
      aiContext={aiContext}
      currentPath={currentPath}
      notifications={snapshot.notifications}
      role={session.user.role}
      searchItems={searchItems}
      userEmail={session.user.email ?? "user@synapseos.dev"}
      userName={session.user.name ?? "SynapseOS User"}
    >
      {children}
    </DashboardShell>
  );
}
