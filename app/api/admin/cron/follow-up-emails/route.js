import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import FollowUpEmail from "@/lib/models/FollowUpEmail";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

const TEMPLATES = {
  care_guide: (orderNumber) => `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#ff7a1a">Your lighter care guide 🔥</h2>
      <p>Thanks for your order <strong>#${orderNumber}</strong>! Here are a few tips to keep your lighter performing at its best:</p>
      <ul>
        <li><strong>Refill:</strong> Use quality butane — purge the tank before refilling for best ignition.</li>
        <li><strong>Flame height:</strong> Adjust the flame dial on the base. Medium height is ideal for everyday use.</li>
        <li><strong>Storage:</strong> Keep away from direct sunlight and heat. Store upright.</li>
        <li><strong>Flint:</strong> Replace when sparks weaken. A spare flint is available in our shop.</li>
      </ul>
      <p>Questions? Reply to this email — we read every one.</p>
      <p style="margin-top:32px"><a href="${SITE_URL}/products" style="background:#ff7a1a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600">Browse accessories</a></p>
    </div>
  `,
  check_in: (orderNumber) => `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2>How's your lighter? 👋</h2>
      <p>It's been a couple of weeks since your order <strong>#${orderNumber}</strong> arrived — we hope you're loving it.</p>
      <p>If you have a moment, we'd love a review. It helps other buyers and means a lot to us.</p>
      <p style="margin-top:24px"><a href="${SITE_URL}/account/orders" style="background:#ff7a1a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600">Leave a review</a></p>
      <p style="color:#888;font-size:13px;margin-top:24px">Not 100% satisfied? Just reply — we'll make it right.</p>
    </div>
  `,
  restock: (orderNumber) => `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2>Time to restock? 🔥</h2>
      <p>Your lighter from order <strong>#${orderNumber}</strong> has been burning for a month now — butane running low?</p>
      <p>We have butane canisters, flints, and accessories ready to ship.</p>
      <p style="margin-top:24px"><a href="${SITE_URL}/products?category=accessories" style="background:#ff7a1a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600">Shop accessories</a></p>
    </div>
  `,
};

// Vercel Cron calls GET with Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const due = await FollowUpEmail.find({
    sent: false,
    scheduledFor: { $lte: new Date() },
  }).limit(50).lean();

  if (due.length === 0) return NextResponse.json({ sent: 0 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  let sent = 0;
  for (const email of due) {
    const html = TEMPLATES[email.type]?.(email.orderNumber);
    if (!html) continue;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || "orders@spark-and-co.com",
          to: email.customerEmail,
          subject: email.subject,
          html,
        }),
      });
      if (res.ok) {
        await FollowUpEmail.updateOne({ _id: email._id }, { $set: { sent: true, sentAt: new Date() } });
        sent++;
      }
    } catch (e) {
      console.error("Follow-up email error:", e.message);
    }
  }

  return NextResponse.json({ sent });
}
