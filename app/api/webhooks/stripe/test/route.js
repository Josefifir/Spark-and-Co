import { NextResponse } from "next/server";

// Simple test endpoint to verify webhook URL is accessible
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    message: "Stripe webhook endpoint is accessible",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: "ok",
    message: "Stripe webhook endpoint can receive POST requests",
    timestamp: new Date().toISOString()
  });
}

// Made with Bob
