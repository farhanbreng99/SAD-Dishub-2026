import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// ─── Route Protection Configuration ────────────────
const protectedRoutes: Record<string, string[]> = {
  "/dashboard": ["applicant"],
  "/apply": ["applicant"],
  "/status": ["applicant"],
  "/admin": ["admin"],
  "/head": ["head"],
};

const publicRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  // ─── Allow static assets and API routes ──────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── Refresh Supabase session ────────────────────
  const supabaseResponse = updateSession(request);

  // ─── Public routes: redirect if already authenticated ──
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (token && role) {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return supabaseResponse;
  }

  // ─── Protected routes: check auth ────────────────
  const matchedRoute = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (matchedRoute) {
    // No token → redirect to login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Wrong role → redirect to their own dashboard
    const allowedRoles = protectedRoutes[matchedRoute];
    if (role && !allowedRoles.includes(role)) {
      const dashboardPath = getDashboardPath(role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // ─── Root redirect ──────────────────────────────
  if (pathname === "/") {
    if (token && role) {
      return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "applicant":
      return "/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "head":
      return "/head/dashboard";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
