import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/lib/models/AdminUser";
import { consumeTotpPending, createAdminSession } from "@/lib/auth/session";
import { verifyTotpCode } from "@/lib/auth/totp";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const Schema = z.object({ code: z.string().length(6).regex(/^\d{6}$/) });

export async function POST(request) {
  // Rate-limit TOTP guessing: 5 attempts per minute per IP
  const ip      = getClientIp(request);
  const limited = rateLimit({ key: `admin-totp:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = Schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
  }

  // Consume the pending token (deletes it from Redis atomically)
  const adminId = await consumeTotpPending();
  if (!adminId) {
    return NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  await dbConnect();
  const admin = await AdminUser.findById(adminId);
  if (!admin || !admin.totpEnabled || !admin.totpSecret) {
    return NextResponse.json({ error: "TOTP not configured." }, { status: 400 });
  }

  const valid = verifyTotpCode(admin.totpSecret, body.code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
  }

  // TOTP verified — issue the real session
  admin.lastLoginAt = new Date();
  await admin.save();

  await createAdminSession(admin);
  return NextResponse.json({ success: true });
}
