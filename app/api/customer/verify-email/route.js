import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `verify-email:${ip}`, limit: 20, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");
  if (!rawToken) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  await dbConnect();

  const hashedToken = createHash("sha256").update(rawToken).digest("hex");
  const customer = await Customer.findOne({
    emailVerificationToken: hashedToken,
    emailVerified: false,
  }).select("+emailVerificationToken");

  if (!customer) {
    return NextResponse.json(
      { error: "Verification link is invalid or already used." },
      { status: 400 }
    );
  }

  customer.emailVerified = true;
  customer.emailVerificationToken = undefined;
  await customer.save();

  return NextResponse.json({ success: true });
}
