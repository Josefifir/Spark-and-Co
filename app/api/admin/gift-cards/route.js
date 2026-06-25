import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import DiscountCode from "@/lib/models/DiscountCode";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { generateDiscountCode } from "@/lib/utils-shop";

const GiftCardSchema = z.object({
  balanceCents: z.number().int().min(100).max(999999), // min $1, max $9999.99
  expiresAt: z.string().datetime().optional(),
  note: z.string().max(200).optional(),
});

// POST — generate a new gift card
export const POST = requireAdmin(async (request) => {
  let body;
  try { body = GiftCardSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data.", details: err.errors?.map(e => e.message) }, { status: 400 }); }

  await dbConnect();

  const code = "GC-" + generateDiscountCode(10);
  const card = await DiscountCode.create({
    code,
    discountType: "gift_card",
    discountValue: body.balanceCents,
    remainingBalanceCents: body.balanceCents,
    isActive: true,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  return NextResponse.json({ card }, { status: 201 });
});

// GET — list all gift cards
export const GET = requireAdmin(async () => {
  await dbConnect();
  const cards = await DiscountCode.find({ discountType: "gift_card" }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ cards });
});
