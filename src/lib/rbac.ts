import type { DashboardSection, PermissionKey, SidebarItem, UserRole } from "@/types";

export const APP_ROLES: UserRole[] = ["ADMIN", "MANAGER", "USER"];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  ADMIN: [
    "dashboard:view",
    "profile:manage",
    "notifications:view",
    "reports:view",
    "reports:create",
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
  MANAGER: [
    "dashboard:view",
    "profile:manage",
    "notifications:view",
    "reports:view",
    "reports:create",
    "reports:manage",
    "department:manage",
    "team:view",
    "analytics:personal",
    "analytics:department",
    "settings:account",
  ],
  USER: [
    "dashboard:view",
    "profile:manage",
    "notifications:view",
    "reports:view",
    "reports:create",
    "analytics:personal",
    "settings:account",
  ],
};

type NavVariant = "admin" | "manager" | "user";

export type DashboardNavItem = SidebarItem & {
  icon: string;
  variant: NavVariant[];
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Role-aware command center",
    section: "overview",
    roles: ["ADMIN", "MANAGER", "USER"],
    icon: "layout-dashboard",
    variant: ["admin", "manager", "user"],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    description: "Global, department, or personal analytics",
    section: "analytics",
    roles: ["ADMIN", "MANAGER", "USER"],
    icon: "chart-no-axes-combined",
    variant: ["admin", "manager"],
  },
  {
    href: "/dashboard/team",
    label: "Team",
    description: "Assigned team visibility and activity",
    section: "team",
    roles: ["ADMIN", "MANAGER"],
    icon: "users-round",
    variant: ["manager"],
  },
  {
    href: "/dashboard/users",
    label: "Users",
    description: "Identity lifecycle and access control",
    section: "users",
    roles: ["ADMIN"],
    icon: "user-cog",
    variant: ["admin"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    description: "Assigned or managed reporting workspace",
    section: "reports",
    roles: ["ADMIN", "MANAGER", "USER"],
    icon: "file-bar-chart-2",
    variant: ["admin", "manager", "user"],
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Realtime alerts and routed signals",
    section: "notifications",
    roles: ["MANAGER", "USER"],
    icon: "bell-ring",
    variant: ["manager", "user"],
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    description: "Identity, avatar, and security posture",
    section: "profile",
    roles: ["MANAGER", "USER"],
    icon: "badge-check",
    variant: ["manager", "user"],
  },
  {
    href: "/dashboard/analytics",
    label: "Personal Analytics",
    description: "Personal report cadence and activity",
    section: "analytics",
    roles: ["USER"],
    icon: "chart-no-axes-combined",
    variant: ["user"],
  },
  {
    href: "/dashboard/departments",
    label: "Departments",
    description: "Department readiness and ownership",
    section: "departments",
    roles: ["ADMIN"],
    icon: "building-2",
    variant: [],
  },
  {
    href: "/dashboard/activity-logs",
    label: "Security",
    description: "Audit feed, RBAC, and operational changes",
    section: "activity-logs",
    roles: ["ADMIN"],
    icon: "history",
    variant: ["admin"],
  },
  {
    href: "/dashboard/system-metrics",
    label: "Monitoring",
    description: "Runtime health and database load",
    section: "system-metrics",
    roles: ["ADMIN"],
    icon: "server-cog",
    variant: ["admin"],
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "Account or global platform settings",
    section: "settings",
    roles: ["ADMIN", "USER"],
    icon: "sliders-horizontal",
    variant: ["admin", "user"],
  },
];

export const PROTECTED_ROUTE_RULES = [
  { prefix: "/admin", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/manager", roles: ["ADMIN", "MANAGER"] as UserRole[] },
  { prefix: "/user", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/dashboard/admin", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/dashboard/manager", roles: ["ADMIN", "MANAGER"] as UserRole[] },
  { prefix: "/dashboard/user", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/api/admin/analytics/monthly", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/admin/analytics/department", roles: ["ADMIN", "MANAGER"] as UserRole[] },
  { prefix: "/api/admin/users/", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/admin/activity-logs", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/admin/reports", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/admin/notifications/process", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/account/reports", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/api/account", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/dashboard/analytics", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/dashboard/users", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/dashboard/system-metrics", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/dashboard/settings", roles: ["ADMIN", "USER"] as UserRole[] },
  { prefix: "/dashboard/departments", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/dashboard/activity-logs", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/dashboard/team", roles: ["ADMIN", "MANAGER"] as UserRole[] },
  { prefix: "/dashboard", roles: ["ADMIN", "MANAGER", "USER"] as UserRole[] },
  { prefix: "/api/admin", roles: ["ADMIN"] as UserRole[] },
  { prefix: "/api/manager", roles: ["ADMIN", "MANAGER"] as UserRole[] },
];

const SECTION_PERMISSIONS: Partial<Record<DashboardSection, PermissionKey[]>> = {
  overview: ["dashboard:view"],
  analytics: ["analytics:personal"],
  reports: ["reports:view"],
  settings: ["settings:account"],
  profile: ["profile:manage"],
  notifications: ["notifications:view"],
  team: ["team:view"],
  departments: ["department:manage"],
  "activity-logs": ["activity:view"],
  "system-metrics": ["metrics:view"],
  users: ["users:manage"],
};

export function getPermissionsForRole(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.USER;
}

export function hasRoleAccess(role: UserRole | undefined, allowedRoles: UserRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function hasPermission(role: UserRole | undefined, permission: PermissionKey) {
  return Boolean(role && getPermissionsForRole(role).includes(permission));
}

export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: PermissionKey[],
) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function canAccessSection(role: UserRole | undefined, section: DashboardSection) {
  const requiredPermissions = SECTION_PERMISSIONS[section];

  if (!requiredPermissions?.length) {
    return true;
  }

  return hasAnyPermission(role, requiredPermissions);
}

export function getSidebarItemsForRole(role: UserRole) {
  const variant: NavVariant =
    role === "ADMIN" ? "admin" : role === "MANAGER" ? "manager" : "user";

  return DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role) && item.variant.includes(variant)).map((item) => {
    if (item.section === "overview") {
      return {
        ...item,
        href: getDefaultDashboardPathForRole(role),
      };
    }

    if (role === "USER" && item.section === "reports") {
      return {
        ...item,
        label: "My Reports",
        description: "Personal reports and assigned work",
      };
    }

    return item;
  });
}

export function getRequiredRolesForPath(pathname: string) {
  return PROTECTED_ROUTE_RULES
    .filter((rule) => pathname.startsWith(rule.prefix))
    .sort((left, right) => right.prefix.length - left.prefix.length)[0]?.roles;
}

export function getDefaultDashboardPathForRole(role: UserRole) {
  if (role === "ADMIN") {
    return "/dashboard/admin";
  }

  if (role === "MANAGER") {
    return "/dashboard/manager";
  }

  return "/dashboard/user";
}
