// Customer-facing: check own loyalty balance
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth/customerSession";
import Customer from "@/lib/models/Customer";
import LoyaltyTransaction from "@/lib/models/LoyaltyTransaction";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getCustomerSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const customer = await Customer.findById(session.customerId)
    .select("loyaltyPoints loyaltyPointsEarned")
    .lean();
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = await LoyaltyTransaction.find({ customer: session.customerId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // 100 points = $1 redemption value
  const redemptionValueCents = (customer.loyaltyPoints || 0);

  return NextResponse.json({
    points: customer.loyaltyPoints || 0,
    pointsEarned: customer.loyaltyPointsEarned || 0,
    redemptionValueCents,
    transactions,
  });
}
