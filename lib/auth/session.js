import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || "admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

if (!JWT_SECRET || JWT_SECRET === "replace_with_a_long_random_secret") {
  // Fail loudly in any real deployment - never allow the default secret.
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set to a strong random value in production.");
  }
}

export function signAdminSession(adminUser) {
  return jwt.sign(
    {
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION_SECONDS }
  );
}

export function verifyAdminSession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}

export { COOKIE_NAME };
