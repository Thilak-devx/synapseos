import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error-response";
import { auth } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/rbac";
import { processNotificationQueue } from "@/services/dbms.service";

const processSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRoleAccess(session.user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = processSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid processing payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const processed = await processNotificationQueue(parsed.data.limit);

    return NextResponse.json({ processed });
  } catch (error) {
    return handleApiError(error, {
      defaultMessage: "Unable to process notifications.",
    });
  }
}
