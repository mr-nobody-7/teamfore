import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_AUTH_PAGES = new Set(["/", "/login", "/register"]);

function isProtectedDashboardRoute(pathname: string): boolean {
  const protectedPrefixes = [
    "/dashboard",
    "/calendar",
    "/leaves",
    "/reports",
    "/teams",
    "/users",
    "/settings",
    "/audit-logs",
  ];

  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get("token")?.value);

  if (!isAuthenticated && isProtectedDashboardRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && PUBLIC_AUTH_PAGES.has(pathname)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
