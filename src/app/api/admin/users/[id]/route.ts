import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { getRequestIp } from "@/lib/request";
import {
  deleteUserWithTransaction,
  setUserStatusWithTransaction,
  updateUserWithTransaction,
} from "@/services/dbms.service";

const updateAdminUserSchema = z.object({
  department: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  name: z.string().trim().min(2),
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]),
});

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin();

  if (!authorization.ok) {
    return authorization.response;
  }

  const body = await request.json();
  const { id } = await params;

  if ("status" in body && Object.keys(body).length === 1) {
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status payload.", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    try {
      const user = await setUserStatusWithTransaction({
        changedById: authorization.session.user.id,
        ipAddress: getRequestIp(request.headers),
        status: parsed.data.status,
        userId: id,
      });

      return NextResponse.json({ user });
    } catch (error) {
      return handleApiError(error, {
        defaultMessage: "Unable to update user status.",
      });
    }
  }

  const parsed = updateAdminUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid user payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const user = await updateUserWithTransaction({
      changedById: authorization.session.user.id,
      departmentName: parsed.data.department,
      email: parsed.data.email,
      ipAddress: getRequestIp(request.headers),
      name: parsed.data.name,
      roleName: parsed.data.role,
      status: parsed.data.status,
      userId: id,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to update user.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;

  try {
    const result = await deleteUserWithTransaction({
      deletedById: authorization.session.user.id,
      ipAddress: getRequestIp(request.headers),
      userId: id,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to delete the selected user.",
    });
  }
}
