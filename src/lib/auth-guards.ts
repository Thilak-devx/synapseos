import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, hasRoleAccess } from "@/lib/rbac";
import type { PermissionKey, UserRole } from "@/types";

export async function requireAuth(callbackUrl?: string) {
  const session = await auth();

  if (!session?.user) {
    const destination = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    redirect(destination as never);
  }

  return session;
}

export async function requireRole(roles: UserRole[], callbackUrl: string) {
  const session = await requireAuth(callbackUrl);

  if (!hasRoleAccess(session.user.role, roles)) {
    redirect("/unauthorized" as never);
  }

  return session;
}

export async function requirePermission(
  permissions: PermissionKey[],
  callbackUrl: string,
) {
  const session = await requireAuth(callbackUrl);

  if (!permissions.some((permission) => hasPermission(session.user.role, permission))) {
    redirect("/unauthorized" as never);
  }

  return session;
}
