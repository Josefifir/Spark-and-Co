import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customerSession";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { generateReferralCode, getReferrerByCode } from "@/lib/referral";
import { sendVerificationEmail } from "@/lib/email/resend";

const RegisterSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  marketingOptIn: z.boolean().optional(),
  referralCode: z.string().max(20).optional(),
});

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 60_000 });
  
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = RegisterSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid registration data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  // Check if customer already exists
  const existingCustomer = await Customer.findByEmail(body.email);
  if (existingCustomer) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  try {
    // Resolve referrer (if code provided)
    let referredBy = null;
    if (body.referralCode) {
      const referrer = await getReferrerByCode(body.referralCode);
      if (referrer) referredBy = referrer._id;
    }

    // Generate a unique referral code for this new customer
    let referralCode;
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode();
      const exists = await Customer.findOne({ referralCode: candidate }).lean();
      if (!exists) { referralCode = candidate; break; }
    }

    // Generate email verification token
    const rawVerifyToken = randomBytes(32).toString("hex");
    const hashedVerifyToken = createHash("sha256").update(rawVerifyToken).digest("hex");

    // Create new customer
    const customer = await Customer.create({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      marketingOptIn: body.marketingOptIn || false,
      loginCount: 1,
      lastLoginAt: new Date(),
      referralCode,
      referredBy,
      emailVerificationToken: hashedVerifyToken,
      emailVerified: false,
    });

    // Send verification email (best-effort, non-blocking)
    sendVerificationEmail(customer, rawVerifyToken).catch((e) =>
      console.error("Verification email error:", e)
    );

    // Create session
    const token = createCustomerSession(customer);
    await setCustomerSessionCookie(token);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}

// Made with Bob