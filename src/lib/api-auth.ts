import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, hasRoleAccess } from "@/lib/rbac";
import type { PermissionKey, UserRole } from "@/types";

export type ApiAuthorizationResult =
  | {
      ok: true;
      session: Exclude<Awaited<ReturnType<typeof auth>>, null>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireApiAuth(): Promise<ApiAuthorizationResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: unauthorized(),
    };
  }

  return {
    ok: true,
    session,
  };
}

export async function requireApiRole(
  roles: UserRole[],
): Promise<ApiAuthorizationResult> {
  const result = await requireApiAuth();

  if (!result.ok) {
    return result;
  }

  if (!hasRoleAccess(result.session.user.role, roles)) {
    return {
      ok: false,
      response: forbidden(),
    };
  }

  return result;
}

export async function requireApiPermission(
  permissions: PermissionKey[],
): Promise<ApiAuthorizationResult> {
  const result = await requireApiAuth();

  if (!result.ok) {
    return result;
  }

  if (!permissions.some((permission) => hasPermission(result.session.user.role, permission))) {
    return {
      ok: false,
      response: forbidden(),
    };
  }

  return result;
}
