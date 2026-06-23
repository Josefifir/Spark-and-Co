import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customerSession";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 60_000 });
  
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = LoginSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid login data." },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    // Find customer and include password for comparison
    const customer = await Customer.findOne({ email: body.email.toLowerCase() })
      .select('+password');
    
    if (!customer) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!customer.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await customer.comparePassword(body.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Update login stats
    customer.lastLoginAt = new Date();
    customer.loginCount += 1;
    await customer.save();

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

// Made with Bob