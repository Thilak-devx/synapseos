import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().max(2048).optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        avatar: parsed.data.avatar || null,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        updatedAt: true,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "profile.updated",
        entityType: "USER",
        entityId: session.user.id,
        ipAddress: getRequestIp(request.headers),
        metadata: {
          fields: Object.keys(parsed.data),
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: session.user.id,
        eventType: "PROFILE_UPDATED",
        entityType: "USER",
        entityId: session.user.id,
        ipAddress: getRequestIp(request.headers),
        payload: {
          fields: Object.keys(parsed.data),
        },
      },
    });

    return updatedUser;
  });

  return NextResponse.json({ user });
}
