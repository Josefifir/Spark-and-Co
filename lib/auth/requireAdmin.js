import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";

/**
 * Wrap an API route handler to require a valid admin session.
 * Usage: export const POST = requireAdmin(async (request, session) => {...})
 */
export function requireAdmin(handler) {
  return async (request, ctx) => {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(request, ctx, session);
  };
}
