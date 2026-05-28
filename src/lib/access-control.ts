import { canAccessSection, hasAnyPermission, hasPermission, hasRoleAccess } from "@/lib/rbac";
import type { DashboardSection, PermissionKey, UserRole } from "@/types";

export function validateRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  return hasRoleAccess(role, allowedRoles);
}

export function validatePermission(
  role: UserRole | undefined,
  permission: PermissionKey,
) {
  return hasPermission(role, permission);
}

export function validateAnyPermission(
  role: UserRole | undefined,
  permissions: PermissionKey[],
) {
  return hasAnyPermission(role, permissions);
}

export function validateSectionAccess(
  role: UserRole | undefined,
  section: DashboardSection,
) {
  return canAccessSection(role, section);
}
