import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import {
  getDefaultDashboardPathForRole,
  getRequiredRolesForPath,
  hasRoleAccess,
} from "@/lib/rbac";
import type { UserRole } from "@/types";

const authRoutes = ["/login", "/register", "/sign-in"];
const protectedPrefixes = ["/dashboard", "/admin", "/manager", "/user", "/api/admin", "/api/manager", "/api/account"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function buildLoginUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const requestedUrl = new URL(request.url);
  loginUrl.searchParams.set("callbackUrl", `${requestedUrl.pathname}${requestedUrl.search}`);
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const role = token?.role as UserRole | undefined;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (authRoutes.includes(pathname) && token) {
    const target =
      typeof role === "string"
        ? getDefaultDashboardPathForRole(role)
        : "/dashboard/user";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(buildLoginUrl(request));
  }

  const requiredRoles = getRequiredRolesForPath(pathname);

  if (requiredRoles && !hasRoleAccess(role, requiredRoles)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/manager/:path*",
    "/user/:path*",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/sign-in",
    "/api/admin/:path*",
    "/api/manager/:path*",
    "/api/account/:path*",
  ],
};
