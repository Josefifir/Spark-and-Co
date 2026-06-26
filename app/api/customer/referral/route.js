import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import { getCustomerSession } from "@/lib/auth/customerSession";
import { ensureReferralCode, getReferralUrl, getReferralSettings } from "@/lib/referral";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const customer = await Customer.findById(session.customerId);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure they have a code (backfill for existing customers)
  const code = await ensureReferralCode(customer);

  // Count confirmed referrals (orders paid via this code)
  const referralOrderCount = await Order.countDocuments({
    referralCode: code,
    paymentStatus: "paid",
    referralCreditAwarded: true,
  });

  const [url, { referralRewardCents }] = await Promise.all([
    getReferralUrl(code),
    getReferralSettings(),
  ]);

  return NextResponse.json({
    code,
    url,
    creditsCents: customer.referralCreditsCents,
    referralCount: customer.referralCount,
    referralOrderCount,
    rewardPerReferralCents: referralRewardCents,
  });
}
