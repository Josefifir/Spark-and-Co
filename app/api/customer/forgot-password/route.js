import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const Schema = z.object({ email: z.string().email() });

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `forgot-pw:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ success: true }); // always appear successful to prevent enumeration
  }

  let body;
  try { body = Schema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  await dbConnect();

  // Always return success to prevent email enumeration
  const customer = await Customer.findOne({ email: body.email.toLowerCase() });
  if (!customer || !customer.isActive) {
    return NextResponse.json({ success: true });
  }

  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  await Customer.updateOne(
    { _id: customer._id },
    {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    }
  );

  await sendPasswordResetEmail(customer, rawToken).catch((e) =>
    console.error("Password reset email error:", e)
  );

  return NextResponse.json({ success: true });
}
