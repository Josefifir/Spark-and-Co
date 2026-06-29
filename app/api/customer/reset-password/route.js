import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `reset-pw:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body;
  try { body = Schema.parse(await request.json()); }
  catch (err) {
    return NextResponse.json(
      { error: "Invalid request.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  const hashedToken = createHash("sha256").update(body.token).digest("hex");
  const customer = await Customer.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!customer) {
    return NextResponse.json(
      { error: "Reset token is invalid or has expired." },
      { status: 400 }
    );
  }

  customer.password = body.password; // hashed by the pre-save hook
  customer.passwordResetToken = undefined;
  customer.passwordResetExpires = undefined;
  await customer.save();

  // Invalidate all existing JWT sessions for this customer
  const { revokeCustomerSessions } = await import("@/lib/auth/customerSession");
  await revokeCustomerSessions(customer._id);

  return NextResponse.json({ success: true });
}
