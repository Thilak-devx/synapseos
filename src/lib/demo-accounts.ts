import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEMO_PASSWORD_SALT_ROUNDS = 12;

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
] as const;

const departments = [
  {
    name: "General",
    description: "Default department for newly provisioned SynapseOS users.",
  },
  {
    name: "Platform Engineering",
    description: "Owns core database platform capabilities and resilience.",
  },
] as const;

const demoAccounts = [
  {
    email: "admin@synapseos.dev",
    name: "SynapseOS Admin",
    password: "admin123",
    role: "ADMIN",
    department: "Platform Engineering",
    notification: {
      type: "SYSTEM",
      title: "Welcome to SynapseOS",
      message: "Your enterprise-grade administration workspace is ready.",
      href: "/dashboard/admin",
      actionLabel: "Open admin control plane",
    },
  },
  {
    email: "manager@synapseos.dev",
    name: "SynapseOS Manager",
    password: "manager123",
    role: "MANAGER",
    department: "Platform Engineering",
    notification: {
      type: "ACCESS",
      title: "Manager scope activated",
      message: "Department analytics, reports, and team views are ready for this demo account.",
      href: "/dashboard/manager",
      actionLabel: "Open manager view",
    },
  },
  {
    email: "user@synapseos.dev",
    name: "SynapseOS User",
    password: "user123",
    role: "USER",
    department: "General",
    notification: {
      type: "ACCOUNT",
      title: "Personal workspace ready",
      message: "Your assigned reports, profile controls, and notification center are ready to review.",
      href: "/dashboard/user",
      actionLabel: "Open workspace",
    },
  },
] as const;

let seedPromise: Promise<void> | null = null;

async function ensureDepartments() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: { description: department.description },
      create: department,
    });
  }
}

async function ensureRolesAndPermissions() {
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
        update: { description: permissionName.replace(":", " ") },
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

async function ensureDemoUsers() {
  for (const account of demoAccounts) {
    const [role, department, password] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { name: account.role } }),
      prisma.department.findUniqueOrThrow({ where: { name: account.department } }),
      bcrypt.hash(account.password, DEMO_PASSWORD_SALT_ROUNDS),
    ]);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password,
        roleId: role.id,
        departmentId: department.id,
        status: "ACTIVE",
      },
      create: {
        name: account.name,
        email: account.email,
        password,
        roleId: role.id,
        departmentId: department.id,
        status: "ACTIVE",
      },
    });

    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        title: account.notification.title,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: account.notification.type,
        title: account.notification.title,
        message: account.notification.message,
        href: account.notification.href,
        actionLabel: account.notification.actionLabel,
        relatedEntityType: "USER",
        relatedEntityId: user.id,
      },
    });
  }
}

export async function ensureSeededDemoAccounts() {
  seedPromise ??= (async () => {
    await ensureDepartments();
    await ensureRolesAndPermissions();
    await ensureDemoUsers();
  })().catch((error) => {
    seedPromise = null;
    throw error;
  });

  return seedPromise;
}
