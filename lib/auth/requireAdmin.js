import { NextResponse } from "next/server";
import { getAdminSession, verifyCsrf } from "@/lib/auth/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Wrap an API route handler to require:
 *   1. A valid Redis-backed admin session
 *   2. A valid CSRF token (for state-changing methods)
 */
export function requireAdmin(handler) {
  return async (request, ctx) => {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF check on every mutating request
    if (!SAFE_METHODS.has(request.method)) {
      const csrfOk = await verifyCsrf(request);
      if (!csrfOk) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }

    return handler(request, ctx, session);
  };
}
