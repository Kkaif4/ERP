import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "./lib/session";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute = [
    "/",
    "/login",
    "/api/auth/login",
    "/api/auth/register",
  ].includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  const sessionData = session ? await decrypt(session).catch(() => null) : null;

  // 1. Protected routes (Admin or Dashboard)
  if (isAdminRoute || isDashboardRoute || (isApiRoute && !isPublicRoute)) {
    if (!sessionData) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based access
    if (isAdminRoute && sessionData.role !== "SUPER_ADMIN") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isDashboardRoute && sessionData.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 2. Redirect logged-in users away from login
  if (sessionData && isPublicRoute) {
    if (sessionData.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
