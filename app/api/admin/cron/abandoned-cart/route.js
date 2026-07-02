import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import AbandonedCart from "@/lib/models/AbandonedCart";
import { sendAbandonedCartEmail } from "@/lib/email/resend";
import DiscountCode from "@/lib/models/DiscountCode";
import { generateDiscountCode } from "@/lib/utils-shop";

export const runtime = "nodejs";

// Vercel Cron calls GET with Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Find carts:
  // - Not yet recovered
  // - Recovery email not yet sent
  // - Last seen at least 1 hour ago
  // - Have an email address (so we can contact them)
  const cutoffOld = new Date(Date.now() - 60 * 60 * 1000);   // 1 hour ago
  const cutoffNew = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago (don't email stale)

  const carts = await AbandonedCart.find({
    recoveredAt: null,
    recoveryEmailSentAt: null,
    customerEmail: { $exists: true, $ne: null, $ne: "" },
    lastSeenAt: { $lt: cutoffOld, $gt: cutoffNew },
    "items.0": { $exists: true },
  }).limit(100).lean();

  if (carts.length === 0) return NextResponse.json({ sent: 0 });

  // Check if we should include a discount code (configurable via env)
  const includeDiscount = process.env.ABANDONED_CART_DISCOUNT === "true";
  const discountPercent = parseInt(process.env.ABANDONED_CART_DISCOUNT_PERCENT || "10", 10);

  let sent = 0;
  for (const cart of carts) {
    let discountCode = null;

    if (includeDiscount) {
      // Generate a one-time discount code for this cart
      const code = "COMEBACK-" + generateDiscountCode(6);
      await DiscountCode.create({
        code,
        discountType: "percentage",
        discountValue: discountPercent,
        maxUsageCount: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
      }).catch(() => {}); // ignore duplicate
      discountCode = code;
    }

    try {
      await sendAbandonedCartEmail(cart, discountCode);
      await AbandonedCart.updateOne(
        { _id: cart._id },
        { $set: { recoveryEmailSentAt: new Date(), discountCode } }
      );
      sent++;
    } catch (e) {
      console.error("Abandoned cart email error:", e.message);
    }
  }

  console.log(`[cron/abandoned-cart] Sent ${sent} recovery emails.`);
  return NextResponse.json({ sent });
}
