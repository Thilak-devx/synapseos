import { validateAnyPermission, validateRole } from "@/lib/access-control";
import type { PermissionKey, UserRole } from "@/types";

type AccessGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  permissions?: PermissionKey[];
  role: UserRole;
  roles?: UserRole[];
};

export function AccessGate({
  children,
  fallback = null,
  permissions,
  role,
  roles,
}: AccessGateProps) {
  const isRoleAllowed = roles ? validateRole(role, roles) : true;
  const arePermissionsAllowed = permissions
    ? validateAnyPermission(role, permissions)
    : true;

  if (!isRoleAllowed || !arePermissionsAllowed) {
    return fallback;
  }

  return children;
}
