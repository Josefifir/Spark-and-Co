import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE  = process.env.ADMIN_SESSION_COOKIE_NAME || "admin_session";
const TOTP_PENDING_COOKIE   = "admin_totp_pending";
const ADMIN_ACCESS_TOKEN    = process.env.ADMIN_ACCESS_TOKEN;
const ACCESS_COOKIE         = "admin_access";
const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 8;

// ── HMAC-signed access cookie ─────────────────────────────────────────────
function signAccessCookie(token) {
  const ts  = Date.now().toString();
  const mac = createHmac("sha256", token).update(ts).digest("hex");
  return `${ts}.${mac}`;
}

function verifyAccessCookie(cookieValue, token) {
  if (!cookieValue || !token) return false;
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return false;
  const ts       = cookieValue.slice(0, dot);
  const mac      = cookieValue.slice(dot + 1);
  const issuedAt = parseInt(ts, 10);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > ACCESS_COOKIE_MAX_AGE * 1000) return false;
  const expected = createHmac("sha256", token).update(ts).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
// ─────────────────────────────────────────────────────────────────────────

// NOTE: The proxy runs in the Edge runtime — it cannot import ioredis.
// Session validity is checked by the presence of the session cookie only;
// the actual Redis lookup happens inside requireAdmin() in each API handler.
// This is intentional: the proxy is a first-pass gate, not the authority.
function hasSessionCookie(request) {
  return !!request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
}

function hasTotpPendingCookie(request) {
  return !!request.cookies.get(TOTP_PENDING_COOKIE)?.value;
}

export function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Block cross-origin POST/PUT/PATCH/DELETE requests to public API routes.
  // Browsers always send an Origin header on cross-origin requests; same-origin
  // requests from the site itself either omit it or match NEXT_PUBLIC_BASE_URL.
  // This stops casual abuse from other origins (curl without a header spoofed,
  // other websites embedding your API) without affecting legitimate same-origin use.
  const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL;
  if (allowedOrigin && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const method = request.method;
    const isMutation = method === "POST" || method === "PUT" ||
                       method === "PATCH" || method === "DELETE";
    // Webhooks must be excluded — Stripe/BTCPay Server POST without an Origin header
    const isWebhook = pathname.startsWith("/api/webhooks/");
    if (!isWebhook && isMutation && origin && origin !== allowedOrigin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const isAdminUi  = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminUi || isAdminApi) {
    if (!ADMIN_ACCESS_TOKEN) {
      return isAdminApi
        ? NextResponse.json({ error: "Not found" }, { status: 404 })
        : new NextResponse(null, { status: 404 });
    }

    const accessCookie = request.cookies.get(ACCESS_COOKIE)?.value;
    const urlToken     = searchParams.get("token");

    // 1. Valid URL token → issue signed access cookie, then redirect to clean URL
    if (urlToken && urlToken === ADMIN_ACCESS_TOKEN) {
      const cleanUrl = new URL(pathname, request.url);
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set(ACCESS_COOKIE, signAccessCookie(ADMIN_ACCESS_TOKEN), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:     "/",
        maxAge:   ACCESS_COOKIE_MAX_AGE,
      });
      addSecurityHeaders(response);
      return response;
    }

    const accessOk = verifyAccessCookie(accessCookie, ADMIN_ACCESS_TOKEN);
    const sessionOk = hasSessionCookie(request);
    const totpPending = hasTotpPendingCookie(request);

    // 2. TOTP step page — only reachable with a valid pending cookie
    if (pathname === "/admin/login/totp" || pathname === "/api/admin/totp-verify") {
      if (accessOk && totpPending) {
        const r = NextResponse.next();
        addSecurityHeaders(r);
        return r;
      }
      // No pending state → back to login
      return isAdminApi
        ? NextResponse.json({ error: "Not found" }, { status: 404 })
        : NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // 3. Login page + login API — accessible with valid access cookie only
    if (pathname === "/admin/login" || pathname === "/api/admin/login") {
      if (accessOk) {
        const r = NextResponse.next();
        addSecurityHeaders(r);
        return r;
      }
      return isAdminApi
        ? NextResponse.json({ error: "Not found" }, { status: 404 })
        : new NextResponse(null, { status: 404 });
    }

    // 4. All other admin routes — require access cookie + session cookie
    if (accessOk && sessionOk) {
      const r = NextResponse.next();
      addSecurityHeaders(r);
      return r;
    }

    // 5. Has session but lost access cookie (e.g. new browser profile) → still let through
    if (sessionOk) {
      const r = NextResponse.next();
      addSecurityHeaders(r);
      return r;
    }

    // 6. Nothing valid → invisible 404
    return isAdminApi
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
