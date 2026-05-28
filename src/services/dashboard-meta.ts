import type { DashboardSection, UserRole } from "@/types";
import type { DashboardSectionMeta } from "@/features/dashboard/types";

const sectionTitles: Record<DashboardSection, string> = {
  overview: "Dashboard overview",
  analytics: "Analytics",
  reports: "Reports workspace",
  notifications: "Notifications",
  profile: "Profile",
  departments: "Departments",
  team: "Team workspace",
  "activity-logs": "Activity logs",
  "system-metrics": "System metrics",
  settings: "Settings",
  users: "User management",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Enterprise command",
  MANAGER: "Department operations",
  USER: "Personal workspace",
};

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Global controls, platform analytics, RBAC governance, reports, audit trails, and infrastructure health.",
  MANAGER: "Department analytics, team workflows, assigned reports, and scoped operational visibility.",
  USER: "Personal reports, notifications, profile settings, and protected account activity.",
};

export function getDashboardSectionMeta(
  role: UserRole,
  section: DashboardSection,
): DashboardSectionMeta {
  return {
    section,
    eyebrow: roleLabels[role],
    title: sectionTitles[section],
    description: roleDescriptions[role],
  };
}
