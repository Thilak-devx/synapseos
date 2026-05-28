import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = process.env.DATABASE_URL?.startsWith("postgresql")
  ? new PrismaPg({ connectionString: process.env.DATABASE_URL })
  : undefined;
const prisma = new PrismaClient({ adapter });

const departments = [
  {
    name: "General",
    description: "Default department for newly provisioned SynapseOS users.",
  },
  {
    name: "Platform Engineering",
    description: "Owns core database platform capabilities and resilience.",
  },
  {
    name: "Security Operations",
    description: "Manages access controls, audit visibility, and compliance workflows.",
  },
];

const roleDefinitions = [
  {
    name: "ADMIN",
    description: "Full dashboard access, analytics, reports, and system controls.",
    permissions: [
      "dashboard:view",
      "profile:manage",
      "notifications:view",
      "reports:view",
      "reports:manage",
      "department:manage",
      "team:view",
      "analytics:personal",
      "analytics:department",
      "analytics:global",
      "users:manage",
      "settings:account",
      "settings:global",
      "activity:view",
      "metrics:view",
      "records:delete",
      "roles:manage",
    ],
  },
  {
    name: "MANAGER",
    description: "Department controls, reports, and limited management visibility.",
    permissions: [
      "dashboard:view",
      "profile:manage",
      "notifications:view",
      "reports:view",
      "reports:manage",
      "department:manage",
      "team:view",
      "analytics:personal",
      "analytics:department",
      "settings:account",
    ],
  },
  {
    name: "USER",
    description: "Personal dashboard, profile management, assigned reports, and notification access.",
    permissions: [
      "dashboard:view",
      "profile:manage",
      "notifications:view",
      "reports:view",
      "analytics:personal",
      "settings:account",
    ],
  },
];

const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL ?? "admin@synapseos.dev").toLowerCase();
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin123";
const defaultAdminName = process.env.DEFAULT_ADMIN_NAME ?? "SynapseOS Admin";
const defaultManagerEmail = "manager@synapseos.dev";
const defaultUserEmail = "user@synapseos.dev";
const defaultManagerPassword = "manager123";
const defaultUserPassword = "user123";

async function upsertDepartments() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: { description: department.description },
      create: department,
    });
  }
}

async function upsertRolesAndPermissions() {
  for (const roleDefinition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: { description: roleDefinition.description },
      create: {
        name: roleDefinition.name,
        description: roleDefinition.description,
      },
    });

    for (const permissionName of roleDefinition.permissions) {
      const permission = await prisma.permission.upsert({
        where: { name: permissionName },
        update: {
          description: permissionName.replace(":", " "),
        },
        create: {
          name: permissionName,
          description: permissionName.replace(":", " "),
        },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function upsertAdmin() {
  const [adminRole, adminDepartment] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } }),
    prisma.department.findUniqueOrThrow({ where: { name: "Platform Engineering" } }),
  ]);

  const password = await bcrypt.hash(defaultAdminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: defaultAdminEmail },
    update: {
      name: defaultAdminName,
      password,
      roleId: adminRole.id,
      departmentId: adminDepartment.id,
      status: "ACTIVE",
    },
    create: {
      name: defaultAdminName,
      email: defaultAdminEmail,
      password,
      roleId: adminRole.id,
      departmentId: adminDepartment.id,
      status: "ACTIVE",
    },
  });

  await prisma.notification.deleteMany({
    where: {
      userId: admin.id,
      title: {
        in: ["Welcome to SynapseOS", "Seed completed"],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "SYSTEM",
        title: "Welcome to SynapseOS",
        message: "Your enterprise-grade administration workspace is ready.",
        href: "/dashboard#workspace-overview",
        actionLabel: "Open workspace",
        relatedEntityType: "USER",
        relatedEntityId: admin.id,
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        title: "Seed completed",
        message: "Default roles, permissions, and departments have been provisioned.",
        href: "/dashboard/users#rbac-control-center",
        actionLabel: "Open RBAC",
        relatedEntityType: "ROLE",
        relatedEntityId: adminRole.id,
      },
    ],
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: "seed.initialize",
      entityType: "SYSTEM",
      entityId: "bootstrap",
      ipAddress: "127.0.0.1",
      metadata: {
        source: "seed",
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: admin.id,
      eventType: "SEED_COMPLETED",
      entityType: "SYSTEM",
      entityId: "bootstrap",
      ipAddress: "127.0.0.1",
      payload: {
        rolesSeeded: roleDefinitions.length,
      },
    },
  });

  await prisma.report.create({
    data: {
      title: "Initial SynapseOS security baseline report",
      reportType: "Audit Delta",
      exportFormat: "PDF",
      summary: "Initial enterprise baseline report generated during platform bootstrap.",
      ownerLabel: defaultAdminName,
      ownerScope: "Global workspace",
      transactionId: "TXN-BOOTSTRAP-ADMIN",
      metrics: [
        { label: "Workflow status", value: "Completed" },
        { label: "Dataset class", value: "Security baseline" },
        { label: "Delivery tier", value: "Board distribution" },
      ],
      analytics: {
        rowsAnalyzed: 2048,
        executionDurationMs: 912,
        transactionCount: 16,
        dbLoad: "8.8 GB",
        securityChecks: "5 of 5 passed",
        anomalyScore: 12,
      },
      preview: {
        highlights: [
          "Baseline security controls committed during seed provisioning",
          "RBAC and notification posture attached to the bootstrap transaction",
          "Prepared for enterprise-grade PDF delivery",
        ],
      },
      generatedById: admin.id,
      assignedToId: admin.id,
      status: "COMPLETED",
    },
  });
}

async function upsertDemoUsers() {
  const [managerRole, userRole, operationsDepartment, generalDepartment] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "MANAGER" } }),
    prisma.role.findUniqueOrThrow({ where: { name: "USER" } }),
    prisma.department.findFirst({
      where: {
        name: {
          contains: "Platform",
        },
      },
    }),
    prisma.department.findUniqueOrThrow({ where: { name: "General" } }),
  ]);

  const [managerPassword, userPassword] = await Promise.all([
    bcrypt.hash(defaultManagerPassword, 12),
    bcrypt.hash(defaultUserPassword, 12),
  ]);

  const manager = await prisma.user.upsert({
    where: { email: defaultManagerEmail },
    update: {
      name: "SynapseOS Manager",
      password: managerPassword,
      roleId: managerRole.id,
      departmentId: operationsDepartment?.id ?? generalDepartment.id,
      status: "ACTIVE",
    },
    create: {
      name: "SynapseOS Manager",
      email: defaultManagerEmail,
      password: managerPassword,
      roleId: managerRole.id,
      departmentId: operationsDepartment?.id ?? generalDepartment.id,
      status: "ACTIVE",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: defaultUserEmail },
    update: {
      name: "SynapseOS User",
      password: userPassword,
      roleId: userRole.id,
      departmentId: generalDepartment.id,
      status: "ACTIVE",
    },
    create: {
      name: "SynapseOS User",
      email: defaultUserEmail,
      password: userPassword,
      roleId: userRole.id,
      departmentId: generalDepartment.id,
      status: "ACTIVE",
    },
  });

  await prisma.notification.deleteMany({
    where: {
      userId: {
        in: [manager.id, user.id],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        type: "ACCESS",
        title: "Manager scope activated",
        message: "Department analytics, reports, and team views are ready for this demo account.",
        href: "/dashboard/manager",
        actionLabel: "Open manager view",
      },
      {
        userId: user.id,
        type: "ACCOUNT",
        title: "Personal workspace ready",
        message: "Your assigned reports, profile controls, and notification center are ready to review.",
        href: "/dashboard/user",
        actionLabel: "Open workspace",
      },
    ],
  });
}

async function seedSystemMetrics() {
  const existing = await prisma.systemMetric.count();

  if (existing > 0) {
    return;
  }

  await prisma.systemMetric.createMany({
    data: [
      { cpuUsage: 38.5, memoryUsage: 62.2, databaseLoad: 12.7, activeUsers: 12 },
      { cpuUsage: 41.1, memoryUsage: 64.8, databaseLoad: 14.1, activeUsers: 19 },
      { cpuUsage: 33.4, memoryUsage: 58.7, databaseLoad: 10.8, activeUsers: 9 },
    ],
  });
}

async function main() {
  await upsertDepartments();
  await upsertRolesAndPermissions();
  await upsertAdmin();
  await upsertDemoUsers();
  await seedSystemMetrics();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
