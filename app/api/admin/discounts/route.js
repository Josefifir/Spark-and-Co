import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import DiscountCode from "@/lib/models/DiscountCode";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const DiscountCodeSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0).max(999999),
  maxUsageCount: z.number().int().min(1).optional().nullable(),
  minimumOrderCents: z.number().int().min(0).optional().default(0),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const GET = requireAdmin(async () => {
  try {
    await dbConnect();

    const codes = await DiscountCode.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      discounts: codes,
    });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes" },
      { status: 500 }
    );
  }
});

export const POST = requireAdmin(async (request) => {
  try {
    await dbConnect();

    const body = await request.json();
    const validated = DiscountCodeSchema.parse(body);

    // Check for duplicate code
    const existing = await DiscountCode.findOne({ code: validated.code });
    if (existing) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 409 }
      );
    }

    const discount = new DiscountCode({
      ...validated,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    });

    await discount.save();

    return NextResponse.json(
      {
        discount: discount.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    );
  }
});
