import "server-only";

import { prisma } from "@/lib/prisma";

type DashboardStatisticsRow = {
  active_users: bigint;
  reports_count: bigint;
  total_users: bigint;
};

type MonitoringSummaryRow = {
  alerts: bigint;
  transactions_count: bigint;
  uptime: string;
};

type AuditLogRow = {
  action: string;
  created_at: Date;
  id: string;
  username: string;
};

type CursorDemoRow = {
  processed_at: Date;
  processed_username: string;
};

function toNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

export async function getAcademicDbmsDemo() {
  const [statisticsRows, monitoringRows, auditLogs] = await Promise.all([
    prisma.$queryRaw<DashboardStatisticsRow[]>`SELECT * FROM public.get_dashboard_statistics()`,
    prisma.$queryRaw<MonitoringSummaryRow[]>`SELECT * FROM public.get_system_monitoring_summary()`,
    prisma.$queryRaw<AuditLogRow[]>`
      SELECT id, action, username, created_at
      FROM public.audit_logs
      ORDER BY created_at DESC
      LIMIT 12
    `,
  ]);

  const statistics = statisticsRows[0] ?? {
    active_users: BigInt(0),
    reports_count: BigInt(0),
    total_users: BigInt(0),
  };
  const monitoring = monitoringRows[0] ?? {
    alerts: BigInt(0),
    transactions_count: BigInt(0),
    uptime: "No monitoring data",
  };

  return {
    auditLogs: auditLogs.map((log) => ({
      action: log.action,
      createdAt: log.created_at.toISOString(),
      id: log.id,
      username: log.username,
    })),
    monitoring: {
      alerts: toNumber(monitoring.alerts),
      transactionsCount: toNumber(monitoring.transactions_count),
      uptime: monitoring.uptime,
    },
    statistics: {
      activeUsers: toNumber(statistics.active_users),
      reportsCount: toNumber(statistics.reports_count),
      totalUsers: toNumber(statistics.total_users),
    },
  };
}

export async function runAcademicCursorDemo(limit = 5) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 25));
  const rows = await prisma.$queryRaw<CursorDemoRow[]>`
    SELECT * FROM public.demo_user_cursor_audit(${safeLimit})
  `;

  return rows.map((row) => ({
    processedAt: row.processed_at.toISOString(),
    processedUsername: row.processed_username,
  }));
}
