import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Customer from "@/lib/models/Customer";
import LoyaltyTransaction from "@/lib/models/LoyaltyTransaction";

// GET — loyalty summary for a customer
export const GET = requireAdmin(async (request, { params }) => {
  const { id } = await params;
  await dbConnect();
  const customer = await Customer.findById(id).select("email firstName lastName loyaltyPoints loyaltyPointsEarned").lean();
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = await LoyaltyTransaction.find({ customer: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ customer, transactions });
});

// POST — manually adjust points (admin use)
const AdjustSchema = z.object({
  points: z.number().int(),
  description: z.string().max(200).optional(),
});

export const POST = requireAdmin(async (request, { params }) => {
  const { id } = await params;
  let body;
  try { body = AdjustSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid data" }, { status: 400 }); }

  await dbConnect();
  const customer = await Customer.findById(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newBalance = Math.max(0, (customer.loyaltyPoints || 0) + body.points);
  customer.loyaltyPoints = newBalance;
  if (body.points > 0) customer.loyaltyPointsEarned = (customer.loyaltyPointsEarned || 0) + body.points;
  await customer.save();

  await LoyaltyTransaction.create({
    customer: id,
    type: "adjust",
    points: body.points,
    description: body.description || "Manual admin adjustment",
    balanceAfter: newBalance,
  });

  return NextResponse.json({ loyaltyPoints: newBalance });
});
