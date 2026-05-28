export type UserRole = "ADMIN" | "MANAGER" | "USER";

export type PermissionKey =
  | "dashboard:view"
  | "profile:manage"
  | "notifications:view"
  | "reports:view"
  | "reports:create"
  | "reports:manage"
  | "department:manage"
  | "team:view"
  | "analytics:personal"
  | "analytics:department"
  | "analytics:global"
  | "users:manage"
  | "settings:account"
  | "settings:global"
  | "activity:view"
  | "metrics:view"
  | "records:delete"
  | "roles:manage";

export type MetricCard = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "steady";
};

export type Workstream = {
  title: string;
  description: string;
  owner: string;
  status: "Live" | "Review" | "Planned";
};

export type DashboardSection =
  | "overview"
  | "analytics"
  | "reports"
  | "settings"
  | "users"
  | "profile"
  | "departments"
  | "team"
  | "activity-logs"
  | "system-metrics"
  | "notifications";

export type SidebarItem = {
  href: string;
  label: string;
  description: string;
  section: DashboardSection;
  roles: UserRole[];
};
