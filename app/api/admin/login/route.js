import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/lib/models/AdminUser";
import { createTotpPending } from "@/lib/auth/session";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const LoginSchema = z.object({
  email:    z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS    = 15 * 60_000; // 15 minutes

export async function POST(request) {
  // Rate-limit by IP: 10 attempts per minute
  const ip      = getClientIp(request);
  const limited = await rateLimit({ key: `admin-login:${ip}`, limit: 10, windowMs: 60_000 });
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

  // Generic message — never reveal whether the email exists
  const genericError = NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 }
  );

  if (!admin) return genericError;

  if (admin.isLocked()) {
    return NextResponse.json(
      { error: "Account temporarily locked. Try again later." },
      { status: 423 }
    );
  }

  const valid = await admin.comparePassword(body.password);

  if (!valid) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockedUntil         = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    return genericError;
  }

  // Password OK — reset counters but don't issue a session yet.
  // TOTP must be verified first.
  admin.failedLoginAttempts = 0;
  admin.lockedUntil         = null;
  await admin.save();

  // If TOTP is not yet set up (first run), skip straight to session.
  // Once totpEnabled is true, the TOTP step is mandatory.
  if (!admin.totpEnabled) {
    // Should not happen in production — catch-all for safety.
    const { createAdminSession } = await import("@/lib/auth/session");
    await createAdminSession(admin);
    return NextResponse.json({ success: true, totpRequired: false });
  }

  // Issue a short-lived pending token — client must complete TOTP
  await createTotpPending(admin);
  return NextResponse.json({ success: true, totpRequired: true });
}
