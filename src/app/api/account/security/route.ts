import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getRequestIp } from "@/lib/request";

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updatePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid security payload.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      password: true,
    },
  });

  if (!currentUser?.password) {
    return NextResponse.json(
      { error: "No local password is configured for this account." },
      { status: 400 },
    );
  }

  const passwordMatches = await verifyPassword(parsed.data.currentPassword, currentUser.password);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Your current password is incorrect." },
      { status: 400 },
    );
  }

  const nextPasswordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        password: nextPasswordHash,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "security.password.updated",
        entityType: "USER",
        entityId: session.user.id,
        ipAddress: getRequestIp(request.headers),
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: session.user.id,
        eventType: "PASSWORD_UPDATED",
        entityType: "USER",
        entityId: session.user.id,
        ipAddress: getRequestIp(request.headers),
        payload: {
          rotationSource: "dashboard",
        },
      },
    });
  });

  return NextResponse.json({ success: true });
}
