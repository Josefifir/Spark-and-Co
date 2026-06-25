/**
 * Admin session — Redis-backed opaque session IDs.
 *
 * A random 32-byte session ID is stored in a cookie.
 * The session payload lives in Redis with a TTL.
 * This means sessions can be revoked instantly (logout, token rotation).
 *
 * Also handles:
 *   - totp_pending cookies (password OK, awaiting TOTP code)
 *   - CSRF tokens (HMAC-signed, per-session)
 */
import { randomBytes, createHmac } from "crypto";
import { cookies } from "next/headers";
import IORedis from "ioredis";

// ── Redis client (reuse the global cache connection if available) ──────────
let redis;
function getRedis() {
  if (!redis) {
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set.");
    redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
  }
  return redis;
}

// ── Constants ─────────────────────────────────────────────────────────────
export const SESSION_COOKIE      = process.env.ADMIN_SESSION_COOKIE_NAME || "admin_session";
export const TOTP_PENDING_COOKIE = "admin_totp_pending";
const SESSION_TTL                = parseInt(process.env.ADMIN_SESSION_TTL_SECONDS || "28800", 10);
const TOTP_PENDING_TTL           = 5 * 60; // 5 minutes to complete TOTP step
const SESSION_KEY_PREFIX         = "adminsess:";
const TOTP_PENDING_KEY_PREFIX    = "adminpending:";
const CSRF_SECRET                = process.env.CSRF_SECRET;

// ── Session store ──────────────────────────────────────────────────────────
function sessionKey(id) { return `${SESSION_KEY_PREFIX}${id}`; }
function pendingKey(id)  { return `${TOTP_PENDING_KEY_PREFIX}${id}`; }

/** Create a full admin session in Redis, set cookie. Returns the CSRF token. */
export async function createAdminSession(adminUser) {
  const id      = randomBytes(32).toString("hex");
  const payload = JSON.stringify({
    sub:   adminUser._id.toString(),
    email: adminUser.email,
    role:  adminUser.role,
    iat:   Math.floor(Date.now() / 1000),
  });
  await getRedis().setex(sessionKey(id), SESSION_TTL, payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   SESSION_TTL,
  });

  // Plant CSRF token (not httpOnly — JS must be able to read it)
  const csrf = signCsrf(id);
  cookieStore.set("csrf_token", csrf, {
    httpOnly: false,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/admin",
    maxAge:   SESSION_TTL,
  });

  return csrf;
}

/** Destroy a session in Redis and clear all admin cookies. */
export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) await getRedis().del(sessionKey(id)).catch(() => {});
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("csrf_token");
  cookieStore.delete(TOTP_PENDING_COOKIE);
}

/** Look up the current session from the cookie. Returns the payload or null. */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const raw = await getRedis().get(sessionKey(id)).catch(() => null);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Verify a session ID string (used in proxy — no cookie read). */
export async function verifySessionId(id) {
  if (!id) return null;
  const raw = await getRedis().get(sessionKey(id)).catch(() => null);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── TOTP pending ───────────────────────────────────────────────────────────
/** After password OK, stash adminId in Redis and set pending cookie. */
export async function createTotpPending(adminUser) {
  const id = randomBytes(16).toString("hex");
  await getRedis().setex(pendingKey(id), TOTP_PENDING_TTL, adminUser._id.toString());
  const cookieStore = await cookies();
  cookieStore.set(TOTP_PENDING_COOKIE, id, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/admin",
    maxAge:   TOTP_PENDING_TTL,
  });
}

/** Validate the pending cookie; returns the admin _id string or null. */
export async function consumeTotpPending() {
  const cookieStore = await cookies();
  const id = cookieStore.get(TOTP_PENDING_COOKIE)?.value;
  if (!id) return null;
  const adminId = await getRedis().getdel(pendingKey(id)).catch(() => null);
  cookieStore.delete(TOTP_PENDING_COOKIE);
  return adminId || null;
}

/** Check whether a valid pending token exists (for proxy guard). */
export async function hasTotpPending(id) {
  if (!id) return false;
  const exists = await getRedis().exists(pendingKey(id)).catch(() => 0);
  return exists === 1;
}

// ── CSRF ───────────────────────────────────────────────────────────────────
function signCsrf(sessionId) {
  if (!CSRF_SECRET) throw new Error("CSRF_SECRET is not set.");
  return createHmac("sha256", CSRF_SECRET).update(sessionId).digest("hex");
}

/** Verify the X-CSRF-Token header against the session cookie. */
export async function verifyCsrf(request) {
  const cookieStore = await cookies();
  const sessionId   = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return false;
  const header = request.headers.get("x-csrf-token");
  if (!header) return false;
  const expected = signCsrf(sessionId);
  // Constant-time comparison
  try {
    const { timingSafeEqual } = await import("crypto");
    return timingSafeEqual(Buffer.from(header, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// Legacy export — kept so any remaining references don't crash.
// The proxy now uses verifySessionId (async) instead of this.
export function verifyAdminSession() { return null; }
