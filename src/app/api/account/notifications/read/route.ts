import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const markNotificationsReadSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = markNotificationsReadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid notification read payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: {
        in: parsed.data.ids,
      },
      userId: session.user.id,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({
    updated: result.count,
    ids: parsed.data.ids,
  });
}
