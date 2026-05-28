import { Prisma } from "@prisma/client";
import { DatabaseServiceUnavailableError, normalizeDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { buildPersistedReportArtifacts } from "@/lib/report-persistence";
import { toPersistedReportStatus } from "@/lib/report-record";
import { hashPassword } from "@/lib/password";
import type { RegisterInput } from "@/lib/auth-schemas";
import type { UserRole } from "@/types";

type ReportStatusValue = "DRAFT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "ARCHIVED";

type ReportLifecycleAction = "view" | "export" | "archive" | "restore" | "delete" | "regenerate";

type TxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const DB_OPERATION_TIMEOUT_MS = 4_000;
const isSqliteRuntime = (process.env.DATABASE_URL ?? "").startsWith("file:");

function createCursorName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function executeDbOperation<T>(label: string, operation: () => Promise<T>) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new DatabaseServiceUnavailableError(
              `${label} could not complete because the PostgreSQL service did not respond in time.`,
            ),
          );
        }, DB_OPERATION_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    throw normalizeDatabaseError(error, `${label} could not reach PostgreSQL.`);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function runProcedureCursor<T>(
  sql: string,
  values: unknown[],
  cursorPrefix: string,
) {
  return executeDbOperation(`${cursorPrefix} stored procedure`, () =>
    prisma.$transaction(async (tx) => {
      const cursorName = createCursorName(cursorPrefix);
      await tx.$executeRawUnsafe(sql, ...values, cursorName);
      return tx.$queryRawUnsafe<T[]>(`FETCH ALL FROM "${cursorName}"`);
    }),
  );
}

function getMonthWindow(reportMonth?: string) {
  if (!reportMonth) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const parsed = new Date(reportMonth);
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return {
    start: new Date(safeDate.getFullYear(), safeDate.getMonth(), 1),
    end: new Date(safeDate.getFullYear(), safeDate.getMonth() + 1, 1),
  };
}

async function createActivityLog(
  tx: TxClient,
  input: {
    userId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    ipAddress?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return tx.activityLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      ipAddress: input.ipAddress ?? undefined,
      metadata: input.metadata,
    },
  });
}

async function createAuditEvent(
  tx: TxClient,
  input: {
    userId?: string | null;
    eventType: string;
    entityType?: string | null;
    entityId?: string | null;
    ipAddress?: string | null;
    payload?: Prisma.InputJsonValue;
  },
) {
  return tx.auditEvent.create({
    data: {
      userId: input.userId ?? undefined,
      eventType: input.eventType,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      ipAddress: input.ipAddress ?? undefined,
      payload: input.payload,
    },
  });
}

async function resolveReportScopeFilter(role: UserRole, userId: string) {
  if (role === "ADMIN") {
    return {};
  }

  if (role === "MANAGER") {
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
      },
    });

    if (!manager?.departmentId) {
      return {
        OR: [{ generatedById: userId }, { assignedToId: userId }],
      } satisfies Prisma.ReportWhereInput;
    }

    return {
      OR: [
        { generatedById: userId },
        { assignedToId: userId },
        {
          generatedBy: {
            is: {
              departmentId: manager.departmentId,
            },
          },
        },
        {
          assignedTo: {
            is: {
              departmentId: manager.departmentId,
            },
          },
        },
      ],
    } satisfies Prisma.ReportWhereInput;
  }

  return {
    OR: [{ generatedById: userId }, { assignedToId: userId }],
  } satisfies Prisma.ReportWhereInput;
}

function getNotificationPayloadForReportAction(action: ReportLifecycleAction, title: string) {
  if (action === "archive") {
    return {
      type: "REPORT",
      title: "Report archived",
      message: `"${title}" was archived and removed from active workspaces.`,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Open reports",
    };
  }

  if (action === "restore") {
    return {
      type: "REPORT",
      title: "Report restored",
      message: `"${title}" is active again and available in the reports workspace.`,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Open reports",
    };
  }

  if (action === "delete") {
    return {
      type: "REPORT",
      title: "Report deleted",
      message: `"${title}" was archived and removed from active workspaces.`,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Review archive",
    };
  }

  if (action === "export") {
    return {
      type: "REPORT",
      title: "Report exported",
      message: `"${title}" was exported successfully.`,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Open reports",
    };
  }

  if (action === "regenerate") {
    return {
      type: "REPORT",
      title: "Report regenerated",
      message: `"${title}" was regenerated and refreshed with new metrics.`,
      href: "/dashboard/reports#reports-workspace",
      actionLabel: "Open report",
    };
  }

  return {
    type: "REPORT",
    title: "Report viewed",
    message: `"${title}" was opened in the report inspector.`,
    href: "/dashboard/reports#reports-workspace",
    actionLabel: "Return to report",
  };
}

function getReportLifecycleActionName(action: ReportLifecycleAction) {
  if (action === "archive") {
    return "report.archived";
  }

  if (action === "restore") {
    return "report.restored";
  }

  if (action === "delete") {
    return "report.deleted";
  }

  if (action === "export") {
    return "report.exported";
  }

  if (action === "regenerate") {
    return "report.regenerated";
  }

  return "report.viewed";
}

export async function createLoginAuditEvent(input: {
  ipAddress?: string | null;
  provider?: string;
  userId: string;
}) {
  return executeDbOperation("login audit event", () =>
    prisma.auditEvent.create({
      data: {
        userId: input.userId,
        eventType: "USER_LOGIN",
        entityType: "USER",
        entityId: input.userId,
        ipAddress: input.ipAddress ?? undefined,
        payload: {
          provider: input.provider ?? "credentials",
        },
      },
    }),
  );
}

export async function createFailedLoginAuditEvent(input: {
  email?: string | null;
  ipAddress?: string | null;
  reason: string;
  userId?: string | null;
}) {
  return executeDbOperation("failed login audit event", () =>
    prisma.auditEvent.create({
      data: {
        userId: input.userId ?? undefined,
        eventType: "USER_LOGIN_FAILED",
        entityType: "USER",
        entityId: input.userId ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        payload: {
          email: input.email ?? null,
          reason: input.reason,
        },
      },
    }),
  );
}

export async function registerUserWithTransaction(
  input: RegisterInput,
  options?: {
    ipAddress?: string;
  },
) {
  const password = await hashPassword(input.password);

  return executeDbOperation("user registration transaction", () =>
    prisma.$transaction(async (tx) => {
      const [department, role] = await Promise.all([
        tx.department.findUnique({
          where: { name: "General" },
          select: { id: true },
        }),
        tx.role.findUnique({
          where: { name: "USER" },
          select: { id: true, name: true },
        }),
      ]);

      if (!role) {
        throw new Error("Default USER role is not configured.");
      }

      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          password,
          status: "ACTIVE",
          roleId: role.id,
          departmentId: department?.id,
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT",
          title: "Account provisioned",
          message: "Your SynapseOS workspace has been created successfully.",
          relatedEntityType: "USER",
          relatedEntityId: user.id,
          metadata: {
            source: "registration_transaction",
          },
        },
      });

      await createActivityLog(tx, {
        userId: user.id,
        action: "user.registered",
        entityType: "USER",
        entityId: user.id,
        ipAddress: options?.ipAddress,
        metadata: {
          role: role.name,
        },
      });

      await createAuditEvent(tx, {
        userId: user.id,
        eventType: "USER_CREATED",
        entityType: "USER",
        entityId: user.id,
        ipAddress: options?.ipAddress,
        payload: {
          role: role.name,
        },
      });

      return user;
    }),
  );
}

export async function generateReportWithTransaction(input: {
  assignedToId?: string | null;
  databaseLoad?: number;
  exportFormat?: "PDF" | "CSV" | "JSON";
  generatedById?: string | null;
  ipAddress?: string;
  memoryUsage?: number;
  owner?: string;
  ownerScope?: string;
  reportType?: string;
  status?: ReportStatusValue;
  title: string;
  cpuUsage?: number;
}) {
  return executeDbOperation("report generation transaction", () =>
    prisma.$transaction(async (tx) => {
      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const reportType = input.reportType ?? "Operational Payload";
      const exportFormat = input.exportFormat ?? "JSON";
      const ownerScope = input.ownerScope ?? "Global workspace";
      const owner = input.owner ?? "SynapseOS";
      const artifacts = buildPersistedReportArtifacts({
        exportFormat,
        owner,
        ownerScope,
        reportType,
      status: input.status ?? "QUEUED",
        title: input.title,
        transactionId,
      });

      const report = await tx.report.create({
        data: {
          title: input.title,
          reportType,
          exportFormat,
          summary: artifacts.summary,
          ownerLabel: owner,
          ownerScope,
          transactionId,
          metrics: artifacts.metrics,
          analytics: artifacts.analytics,
          preview: artifacts.preview,
          generatedById: input.generatedById ?? undefined,
          assignedToId: input.assignedToId ?? input.generatedById ?? undefined,
          status: input.status ?? "QUEUED",
        },
      });

      const systemMetric = await tx.systemMetric.create({
        data: {
          cpuUsage: input.cpuUsage ?? 42.5,
          memoryUsage: input.memoryUsage ?? 64.1,
          databaseLoad: input.databaseLoad ?? 12.3,
          activeUsers: 1,
        },
      });

      let notification: Awaited<ReturnType<typeof tx.notification.create>> | null = null;
      if (input.assignedToId || input.generatedById) {
        const notificationUserId = input.assignedToId ?? input.generatedById!;
        notification = await tx.notification.create({
          data: {
            userId: notificationUserId,
            type: "REPORT",
            title: "Report pipeline started",
            message: `"${input.title}" has entered the reporting pipeline.`,
            href: "/dashboard/reports#reports-workspace",
            actionLabel: "Open reports",
            relatedEntityType: "REPORT",
            relatedEntityId: report.id,
            metadata: {
              status: input.status ?? "QUEUED",
              exportFormat,
              reportType,
            },
          },
        });
      }

      const activityLog = await createActivityLog(tx, {
        userId: input.generatedById,
        action: "report.generated.transaction",
        entityType: "REPORT",
        entityId: report.id,
        ipAddress: input.ipAddress,
        metadata: {
          assignedToId: input.assignedToId ?? null,
          status: input.status ?? "QUEUED",
        },
      });

      return {
        activityLog,
        artifacts,
        notification,
        report,
        systemMetric,
      };
    }),
  );
}

async function getScopedReportForUpdate(tx: TxClient, input: {
  actorId: string;
  reportId: string;
  role: UserRole;
}) {
  const scopeFilter = await resolveReportScopeFilter(input.role, input.actorId);
  const report = await tx.report.findFirst({
    where: {
      id: input.reportId,
      ...scopeFilter,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      generatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!report) {
    throw new Error("The requested report is outside your authorized scope.");
  }

  return report;
}

export async function updateReportWithTransaction(input: {
  actorId: string;
  exportFormat: "PDF" | "CSV" | "JSON";
  ipAddress?: string;
  owner: string;
  reportId: string;
  reportType: string;
  role: UserRole;
  status?: string;
  title: string;
}) {
  return executeDbOperation("report update transaction", () =>
    prisma.$transaction(async (tx) => {
      const existingReport = await getScopedReportForUpdate(tx, input);
      const nextStatus = toPersistedReportStatus(input.status);
      const isArchived = nextStatus === "ARCHIVED";
      const artifacts = buildPersistedReportArtifacts({
        exportFormat: input.exportFormat,
        owner: input.owner,
        ownerScope: existingReport.ownerScope ?? "Personal workspace",
        reportType: input.reportType,
        status: nextStatus,
        title: input.title,
        transactionId: existingReport.transactionId ?? existingReport.id,
      });

      const updatedReport = await tx.report.update({
        where: { id: existingReport.id },
        data: {
          title: input.title,
          reportType: input.reportType,
          exportFormat: input.exportFormat,
          ownerLabel: input.owner,
          status: isArchived ? existingReport.status : nextStatus,
          isArchived,
          archivedAt: isArchived ? new Date() : null,
          summary: artifacts.summary,
          metrics: artifacts.metrics,
          analytics: artifacts.analytics,
          preview: artifacts.preview,
        },
      });

      const [activityLog, auditEvent] = await Promise.all([
        createActivityLog(tx, {
          userId: input.actorId,
          action: "report.updated",
          entityType: "REPORT",
          entityId: updatedReport.id,
          ipAddress: input.ipAddress,
          metadata: {
            title: updatedReport.title,
            exportFormat: updatedReport.exportFormat,
            reportType: updatedReport.reportType,
          },
        }),
        createAuditEvent(tx, {
          userId: input.actorId,
          eventType: "REPORT_UPDATED",
          entityType: "REPORT",
          entityId: updatedReport.id,
          ipAddress: input.ipAddress,
          payload: {
            title: updatedReport.title,
            exportFormat: updatedReport.exportFormat,
            reportType: updatedReport.reportType,
          },
        }),
      ]);

      return { activityLog, auditEvent, report: updatedReport };
    }),
  );
}

export async function duplicateReportWithTransaction(input: {
  actorId: string;
  ipAddress?: string;
  reportId: string;
  role: UserRole;
}) {
  return executeDbOperation("report duplicate transaction", () =>
    prisma.$transaction(async (tx) => {
      const sourceReport = await getScopedReportForUpdate(tx, input);
      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const duplicatedReport = await tx.report.create({
        data: {
          title: `${sourceReport.title} Copy`,
          reportType: sourceReport.reportType,
          exportFormat: sourceReport.exportFormat,
          summary: sourceReport.summary,
          ownerLabel: sourceReport.ownerLabel,
          ownerScope: sourceReport.ownerScope,
          transactionId,
          metrics: sourceReport.metrics ?? Prisma.JsonNull,
          analytics: sourceReport.analytics ?? Prisma.JsonNull,
          preview: sourceReport.preview ?? Prisma.JsonNull,
          generatedById: input.actorId,
          assignedToId: sourceReport.assignedToId ?? input.actorId,
          status: "QUEUED",
        },
      });

      const [activityLog, auditEvent, notification] = await Promise.all([
        createActivityLog(tx, {
          userId: input.actorId,
          action: "report.duplicated",
          entityType: "REPORT",
          entityId: duplicatedReport.id,
          ipAddress: input.ipAddress,
          metadata: {
            sourceReportId: sourceReport.id,
          },
        }),
        createAuditEvent(tx, {
          userId: input.actorId,
          eventType: "REPORT_DUPLICATED",
          entityType: "REPORT",
          entityId: duplicatedReport.id,
          ipAddress: input.ipAddress,
          payload: {
            sourceReportId: sourceReport.id,
          },
        }),
        tx.notification.create({
          data: {
            userId: sourceReport.assignedToId ?? input.actorId,
            type: "REPORT",
            title: "Report duplicated",
            message: `"${duplicatedReport.title}" was added to the reporting queue.`,
            href: "/dashboard/reports#reports-workspace",
            actionLabel: "Open reports",
            relatedEntityType: "REPORT",
            relatedEntityId: duplicatedReport.id,
          },
        }),
      ]);

      return { activityLog, auditEvent, notification, report: duplicatedReport };
    }),
  );
}

export async function fetchScopedReports(input: {
  includeArchived?: boolean;
  limit?: number;
  role: UserRole;
  userId: string;
}) {
  return executeDbOperation("scoped report query", async () => {
    const scopeFilter = await resolveReportScopeFilter(input.role, input.userId);
    return prisma.report.findMany({
      where: {
        ...scopeFilter,
        ...(input.includeArchived ? {} : { isArchived: false }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: input.limit ?? 50,
    });
  });
}

export async function applyReportLifecycleAction(input: {
  action: ReportLifecycleAction;
  actorId: string;
  ipAddress?: string;
  reportId: string;
  role: UserRole;
}) {
  return executeDbOperation(`report ${input.action} transaction`, () =>
    prisma.$transaction(async (tx) => {
      const scopeFilter = await resolveReportScopeFilter(input.role, input.actorId);
      const report = await tx.report.findFirst({
        where: {
          id: input.reportId,
          ...scopeFilter,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
            },
          },
          generatedBy: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!report) {
        throw new Error("The requested report is outside your authorized scope.");
      }

      const now = new Date();
      const nextData: Prisma.ReportUpdateInput = {};

      if (input.action === "archive") {
        nextData.isArchived = true;
        nextData.archivedAt = now;
      }

      if (input.action === "restore") {
        nextData.isArchived = false;
        nextData.archivedAt = null;
        nextData.deletedAt = null;
      }

      if (input.action === "delete") {
        nextData.isArchived = true;
        nextData.archivedAt = report.archivedAt ?? now;
        nextData.deletedAt = now;
      }

      if (input.action === "view") {
        nextData.lastViewedAt = now;
      }

      if (input.action === "regenerate") {
        const artifacts = buildPersistedReportArtifacts({
          exportFormat: report.exportFormat as "PDF" | "CSV" | "JSON",
          owner: report.ownerLabel ?? "SynapseOS",
          ownerScope: report.ownerScope ?? "Personal workspace",
          reportType: report.reportType,
          status: "COMPLETED",
          title: report.title,
          transactionId: report.transactionId ?? report.id,
        });
        nextData.status = "COMPLETED";
        nextData.summary = artifacts.summary;
        nextData.metrics = artifacts.metrics;
        nextData.analytics = artifacts.analytics;
        nextData.preview = artifacts.preview;
        nextData.isArchived = false;
        nextData.archivedAt = null;
        nextData.deletedAt = null;
      }

      const updatedReport =
        Object.keys(nextData).length > 0
          ? await tx.report.update({
              where: { id: report.id },
              data: nextData,
            })
          : report;

      const actionName = getReportLifecycleActionName(input.action);
      const auditType = `REPORT_${input.action.toUpperCase()}`;
      const notificationPayload = getNotificationPayloadForReportAction(input.action, report.title);
      const notificationUserId = report.assignedToId ?? report.generatedById ?? input.actorId;

      const [activityLog, auditEvent, notification] = await Promise.all([
        createActivityLog(tx, {
          userId: input.actorId,
          action: actionName,
          entityType: "REPORT",
          entityId: report.id,
          ipAddress: input.ipAddress,
          metadata: {
            title: report.title,
            exportFormat: report.exportFormat,
            reportType: report.reportType,
          },
        }),
        createAuditEvent(tx, {
          userId: input.actorId,
          eventType: auditType,
          entityType: "REPORT",
          entityId: report.id,
          ipAddress: input.ipAddress,
          payload: {
            title: report.title,
            exportFormat: report.exportFormat,
            reportType: report.reportType,
          },
        }),
        tx.notification.create({
          data: {
            userId: notificationUserId,
            type: notificationPayload.type,
            title: notificationPayload.title,
            message: notificationPayload.message,
            href: notificationPayload.href,
            actionLabel: notificationPayload.actionLabel,
            relatedEntityType: "REPORT",
            relatedEntityId: report.id,
            metadata: {
              action: input.action,
            },
          },
        }),
      ]);

      return {
        activityLog,
        auditEvent,
        notification,
        report: updatedReport,
      };
    }),
  );
}

export async function assignRoleWithTransaction(input: {
  changedById?: string | null;
  ipAddress?: string;
  roleName: UserRole;
  userId: string;
}) {
  return executeDbOperation("role assignment transaction", () =>
    prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { name: input.roleName },
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        throw new Error(`Role ${input.roleName} does not exist.`);
      }

      const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
          roleId: role.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: updatedUser.id,
          type: "ACCESS",
          title: "Role updated",
          message: `Your SynapseOS role is now ${input.roleName}.`,
          relatedEntityType: "ROLE",
          relatedEntityId: role.id,
          metadata: {
            effectivePermissions: role.permissions.map(({ permission }) => permission.name),
          },
        },
      });

      await createActivityLog(tx, {
        userId: input.changedById ?? updatedUser.id,
        action: "user.role.assigned",
        entityType: "USER",
        entityId: updatedUser.id,
        ipAddress: input.ipAddress,
        metadata: {
          role: input.roleName,
          effectivePermissions: role.permissions.map(({ permission }) => permission.name),
        },
      });

      await createAuditEvent(tx, {
        userId: input.changedById ?? updatedUser.id,
        eventType: "ROLE_ASSIGNED",
        entityType: "USER",
        entityId: updatedUser.id,
        ipAddress: input.ipAddress,
        payload: {
          role: input.roleName,
          effectivePermissions: role.permissions.map(({ permission }) => permission.name),
        },
      });

      return {
        role: input.roleName,
        user: updatedUser,
      };
    }),
  );
}

export async function createUserWithTransaction(input: {
  createdById: string;
  departmentName?: string | null;
  email: string;
  ipAddress?: string;
  name: string;
  password: string;
  roleName: UserRole;
  status?: "ACTIVE" | "INVITED" | "SUSPENDED";
}) {
  const password = await hashPassword(input.password);

  return executeDbOperation("admin user create transaction", () =>
    prisma.$transaction(async (tx) => {
      const [role, department] = await Promise.all([
        tx.role.findUnique({
          where: { name: input.roleName },
          select: { id: true, name: true },
        }),
        input.departmentName
          ? tx.department.upsert({
              where: { name: input.departmentName },
              update: {},
              create: {
                name: input.departmentName,
                description: `${input.departmentName} workspace provisioned from the Admin Control Center.`,
              },
              select: { id: true, name: true },
            })
          : tx.department.findUnique({
              where: { name: "General" },
              select: { id: true, name: true },
            }),
      ]);

      if (!role) {
        throw new Error(`Role ${input.roleName} does not exist.`);
      }

      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          password,
          roleId: role.id,
          departmentId: department?.id,
          status: input.status ?? "ACTIVE",
        },
        include: {
          department: true,
          role: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: "ACCESS",
          title: "Account provisioned",
          message: "Your SynapseOS account has been created by an administrator.",
          href: "/dashboard/user",
          actionLabel: "Open workspace",
          relatedEntityType: "USER",
          relatedEntityId: user.id,
        },
      });

      await createActivityLog(tx, {
        userId: input.createdById,
        action: "user.created",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        metadata: {
          role: role.name,
          status: user.status,
        },
      });

      await createAuditEvent(tx, {
        userId: input.createdById,
        eventType: "USER_CREATED_BY_ADMIN",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        payload: {
          email: user.email,
          role: role.name,
          status: user.status,
        },
      });

      return user;
    }),
  );
}

export async function updateUserWithTransaction(input: {
  changedById: string;
  departmentName?: string | null;
  email: string;
  ipAddress?: string;
  name: string;
  roleName: UserRole;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  userId: string;
}) {
  return executeDbOperation("admin user update transaction", () =>
    prisma.$transaction(async (tx) => {
      const [targetUser, role, department] = await Promise.all([
        tx.user.findUnique({
          where: { id: input.userId },
          select: { id: true, email: true, role: { select: { name: true } } },
        }),
        tx.role.findUnique({
          where: { name: input.roleName },
          select: { id: true, name: true },
        }),
        input.departmentName
          ? tx.department.upsert({
              where: { name: input.departmentName },
              update: {},
              create: {
                name: input.departmentName,
                description: `${input.departmentName} workspace provisioned from the Admin Control Center.`,
              },
              select: { id: true, name: true },
            })
          : tx.department.findUnique({
              where: { name: "General" },
              select: { id: true, name: true },
            }),
      ]);

      if (!targetUser) {
        throw new Error("The requested user no longer exists.");
      }

      if (!role) {
        throw new Error(`Role ${input.roleName} does not exist.`);
      }

      const user = await tx.user.update({
        where: { id: input.userId },
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          roleId: role.id,
          departmentId: department?.id,
          status: input.status,
        },
        include: {
          department: true,
          role: true,
        },
      });

      await createActivityLog(tx, {
        userId: input.changedById,
        action: "user.updated",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        metadata: {
          previousEmail: targetUser.email,
          previousRole: targetUser.role.name,
          role: role.name,
          status: user.status,
        },
      });

      await createAuditEvent(tx, {
        userId: input.changedById,
        eventType: "USER_UPDATED_BY_ADMIN",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        payload: {
          previousEmail: targetUser.email,
          previousRole: targetUser.role.name,
          email: user.email,
          role: role.name,
          status: user.status,
        },
      });

      return user;
    }),
  );
}

export async function setUserStatusWithTransaction(input: {
  changedById: string;
  ipAddress?: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  userId: string;
}) {
  return executeDbOperation("admin user status transaction", () =>
    prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, status: true },
      });

      if (!targetUser) {
        throw new Error("The requested user no longer exists.");
      }

      if (targetUser.id === input.changedById && input.status === "SUSPENDED") {
        throw new Error("You cannot suspend the active administrator session.");
      }

      const user = await tx.user.update({
        where: { id: input.userId },
        data: { status: input.status },
        include: {
          department: true,
          role: true,
        },
      });

      await createActivityLog(tx, {
        userId: input.changedById,
        action: input.status === "SUSPENDED" ? "user.suspended" : "user.reactivated",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        metadata: {
          previousStatus: targetUser.status,
          status: user.status,
        },
      });

      await createAuditEvent(tx, {
        userId: input.changedById,
        eventType: input.status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
        entityType: "USER",
        entityId: user.id,
        ipAddress: input.ipAddress,
        payload: {
          previousStatus: targetUser.status,
          status: user.status,
        },
      });

      return user;
    }),
  );
}

export async function deleteUserWithTransaction(input: {
  deletedById: string;
  ipAddress?: string;
  userId: string;
}) {
  return executeDbOperation("user delete transaction", () =>
    prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: input.userId },
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!targetUser) {
        throw new Error("The requested user no longer exists.");
      }

      if (targetUser.id === input.deletedById) {
        throw new Error("You cannot delete the active administrator session.");
      }

      await createActivityLog(tx, {
        userId: input.deletedById,
        action: "user.deleted",
        entityType: "USER",
        entityId: targetUser.id,
        ipAddress: input.ipAddress,
        metadata: {
          deletedEmail: targetUser.email,
          deletedRole: targetUser.role.name,
        },
      });

      await createAuditEvent(tx, {
        userId: input.deletedById,
        eventType: "USER_DELETED",
        entityType: "USER",
        entityId: targetUser.id,
        ipAddress: input.ipAddress,
        payload: {
          deletedEmail: targetUser.email,
          deletedRole: targetUser.role.name,
        },
      });

      await tx.user.delete({
        where: {
          id: targetUser.id,
        },
      });

      return {
        deletedUser: {
          email: targetUser.email,
          id: targetUser.id,
          name: targetUser.name,
          role: targetUser.role.name,
        },
      };
    }),
  );
}

export async function getMonthlyAnalyticsReport(reportMonth?: string) {
  if (isSqliteRuntime) {
    return executeDbOperation("monthly analytics fallback", async () => {
      const { start, end } = getMonthWindow(reportMonth);
      const [activeUsers, reportsCreated, metricAggregate] = await Promise.all([
        prisma.user.count({
          where: {
            status: "ACTIVE",
            updatedAt: {
              gte: start,
              lt: end,
            },
          },
        }),
        prisma.report.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),
        prisma.systemMetric.aggregate({
          _avg: {
            cpuUsage: true,
            memoryUsage: true,
            databaseLoad: true,
          },
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),
      ]);

      return [
        {
          report_month: start,
          active_users: BigInt(activeUsers),
          reports_created: BigInt(reportsCreated),
          avg_cpu_usage: metricAggregate._avg.cpuUsage ?? 0,
          avg_memory_usage: metricAggregate._avg.memoryUsage ?? 0,
          avg_database_load: metricAggregate._avg.databaseLoad ?? 0,
        },
      ];
    });
  }

  return runProcedureCursor<{
    report_month: Date;
    active_users: bigint;
    reports_created: bigint;
    avg_cpu_usage: Prisma.Decimal;
    avg_memory_usage: Prisma.Decimal;
    avg_database_load: Prisma.Decimal;
  }>(
    "CALL public.sp_monthly_analytics_report($1::date, $2::refcursor)",
    [reportMonth ?? null],
    "monthly_analytics",
  );
}

export async function getUserSummaryReport(userId: string) {
  if (isSqliteRuntime) {
    return executeDbOperation("user summary fallback", async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          activityLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          notifications: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          reports: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          assignedReports: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) {
        return [];
      }

      return [
        {
          user_id: user.id,
          user_name: user.name,
          email: user.email,
          activities: user.activityLogs,
          notifications: user.notifications,
          reports: [...user.reports, ...user.assignedReports],
        },
      ];
    });
  }

  return runProcedureCursor<{
    user_id: string;
    user_name: string;
    email: string;
    activities: Prisma.JsonValue;
    notifications: Prisma.JsonValue;
    reports: Prisma.JsonValue;
  }>(
    "CALL public.sp_user_summary_report($1::text, $2::refcursor)",
    [userId],
    "user_summary",
  );
}

export async function getDepartmentAnalyticsReport(departmentId?: string) {
  if (isSqliteRuntime) {
    return executeDbOperation("department analytics fallback", async () => {
      const departments = await prisma.department.findMany({
        where: departmentId ? { id: departmentId } : undefined,
        include: {
          users: {
            include: {
              notifications: {
                where: { isRead: false },
                select: { id: true },
              },
              reports: {
                select: { id: true },
              },
              assignedReports: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return departments.map((department) => {
        const memberCount = department.users.length;
        const activeMemberCount = department.users.filter((user) => user.status === "ACTIVE").length;
        const reportsCreated = department.users.reduce(
          (total, user) => total + user.reports.length + user.assignedReports.length,
          0,
        );
        const unreadNotifications = department.users.reduce(
          (total, user) => total + user.notifications.length,
          0,
        );

        return {
          department_id: department.id,
          department_name: department.name,
          member_count: BigInt(memberCount),
          active_member_count: BigInt(activeMemberCount),
          reports_created: BigInt(reportsCreated),
          unread_notifications: BigInt(unreadNotifications),
        };
      });
    });
  }

  return runProcedureCursor<{
    department_id: string;
    department_name: string;
    member_count: bigint;
    active_member_count: bigint;
    reports_created: bigint;
    unread_notifications: bigint;
  }>(
    "CALL public.sp_department_analytics($1::text, $2::refcursor)",
    [departmentId ?? null],
    "department_analytics",
  );
}

export async function processNotificationQueue(limit = 10) {
  if (isSqliteRuntime) {
    return executeDbOperation("notification queue fallback", async () =>
      prisma.$transaction(async (tx) => {
        const notifications = await tx.notification.findMany({
          where: { isRead: false },
          orderBy: { createdAt: "asc" },
          take: limit,
        });

        if (notifications.length) {
          await tx.notification.updateMany({
            where: {
              id: {
                in: notifications.map((notification) => notification.id),
              },
            },
            data: {
              isRead: true,
            },
          });
        }

        return notifications.map((notification) => ({
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          type: notification.type,
        }));
      }),
    );
  }

  return runProcedureCursor<{
    id: string;
    userId: string;
    title: string;
    type: string;
  }>(
    "CALL public.sp_process_notification_queue($1::integer, $2::refcursor)",
    [limit],
    "notification_queue",
  );
}

export async function fetchActivityLogs(limit = 50) {
  return executeDbOperation("activity log query", () =>
    prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    }),
  );
}

export async function fetchReports(limit = 50) {
  return executeDbOperation("report query", () =>
    prisma.report.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    }),
  );
}
