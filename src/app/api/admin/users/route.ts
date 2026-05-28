import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";
import { createUserWithTransaction } from "@/services/dbms.service";

const createAdminUserSchema = z.object({
  department: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  name: z.string().trim().min(2),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).default("ACTIVE"),
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      department: {
        select: {
          name: true,
        },
      },
      role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAdminUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid user payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const user = await createUserWithTransaction({
      createdById: session.user.id,
      departmentName: parsed.data.department,
      email: parsed.data.email,
      ipAddress: getRequestIp(request.headers),
      name: parsed.data.name,
      password: parsed.data.password,
      roleName: parsed.data.role,
      status: parsed.data.status,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to create user.",
    });
  }
}
