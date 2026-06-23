import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/lib/models/AdminUser";
import { signAdminSession, setAdminSessionCookie } from "@/lib/auth/session";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60_000; // 15 minutes

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = rateLimit({ key: `admin-login:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = LoginSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await dbConnect();

  const admin = await AdminUser.findOne({ email: body.email.toLowerCase() });

  // Use a generic error message in all failure cases to avoid leaking
  // whether an email exists in the system (user enumeration protection).
  const genericError = NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!admin) return genericError;

  if (admin.isLocked()) {
    return NextResponse.json(
      { error: "Account temporarily locked due to repeated failed attempts. Try again later." },
      { status: 423 }
    );
  }

  const valid = await admin.comparePassword(body.password);

  if (!valid) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    return genericError;
  }

  // Success - reset counters
  admin.failedLoginAttempts = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signAdminSession(admin);
  await setAdminSessionCookie(token);

  return NextResponse.json({ success: true, email: admin.email, role: admin.role });
}
