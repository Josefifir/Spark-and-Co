import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import CookieConsent from "@/lib/models/CookieConsent";
import { getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

const ConsentSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  preferences: z.boolean(),
  consentVersion: z.string(),
  locale: z.string().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = ConsentSchema.parse(body);

    await dbConnect();

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    
    // Generate or get session ID from cookie
    const sessionId = request.cookies.get("session-id")?.value || 
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save consent record
    await CookieConsent.create({
      sessionId,
      ipAddress: ip,
      userAgent,
      necessary: validated.necessary,
      analytics: validated.analytics,
      marketing: validated.marketing,
      preferences: validated.preferences,
      consentVersion: validated.consentVersion,
      locale: validated.locale || "en",
    });

    const response = NextResponse.json({ success: true });
    
    // Set session cookie if not exists
    if (!request.cookies.get("session-id")) {
      response.cookies.set("session-id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid consent data" },
        { status: 400 }
      );
    }

    console.error("Error saving cookie consent:", error);
    return NextResponse.json(
      { error: "Failed to save consent" },
      { status: 500 }
    );
  }
}

// Made with Bob
