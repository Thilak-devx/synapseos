import type { DefaultSession } from "next-auth";
import type { PermissionKey, UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      permissions: PermissionKey[];
    };
  }

  interface User {
    role?: UserRole;
    permissions?: PermissionKey[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    permissions?: PermissionKey[];
  }
}
