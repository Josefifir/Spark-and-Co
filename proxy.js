import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";

const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "admin_session";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard pages (but not the login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? verifyAdminSession(token) : null;

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Baseline security headers on every response
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
