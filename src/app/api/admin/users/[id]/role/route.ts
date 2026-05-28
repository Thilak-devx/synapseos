import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { getRequestIp } from "@/lib/request";
import { assignRoleWithTransaction } from "@/services/dbms.service";

const assignRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = assignRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { id } = await params;
  try {
    const result = await assignRoleWithTransaction({
      userId: id,
      roleName: parsed.data.role,
      changedById: session.user.id,
      ipAddress: getRequestIp(request.headers),
    });

    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to update the user role.",
    });
  }
}
