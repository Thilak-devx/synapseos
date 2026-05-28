import { prisma } from "@/lib/prisma";
import type { RegisterInput, LoginInput } from "@/lib/auth-schemas";
import type { PermissionKey, UserRole } from "@/types";
import { registerUserWithTransaction } from "@/services/dbms.service";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      department: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
}

export async function getUserRoleById(userId: string): Promise<UserRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  return (user?.role.name as UserRole | undefined) ?? null;
}

export async function getUserPermissionsById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    user?.role?.permissions.map(({ permission }) => permission.name as PermissionKey) ?? []
  );
}

export async function createUser(
  input: RegisterInput,
  options?: {
    ipAddress?: string;
  },
) {
  return registerUserWithTransaction(input, options);
}

export function mapRolePermissions(
  permissions:
    | {
        permission: {
          name: string;
        };
      }[]
    | undefined,
) {
  return permissions?.map(({ permission }) => permission.name as PermissionKey) ?? [];
}

export type LoginPayload = LoginInput;
