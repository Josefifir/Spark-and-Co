import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import DiscountCode from "@/lib/models/DiscountCode";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";
import { ObjectId } from "mongodb";

const UpdateDiscountCodeSchema = z.object({
  discountValue: z.number().min(0).max(999999).optional(),
  maxUsageCount: z.number().int().min(1).optional().nullable(),
  minimumOrderCents: z.number().int().min(0).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const PATCH = requireAdmin(async (request, { params }) => {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid discount code ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const validated = UpdateDiscountCodeSchema.parse(body);

    const updateData = {
      ...validated,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : validated.expiresAt,
    };

    const discount = await DiscountCode.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      discount: discount.toObject(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
});

export const DELETE = requireAdmin(async (request, { params }) => {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid discount code ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const discount = await DiscountCode.findByIdAndDelete(id);

    if (!discount) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
});
