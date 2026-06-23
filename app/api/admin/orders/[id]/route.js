import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  fulfillmentStatus: z.enum(["unfulfilled", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().max(200).optional(),
});

export const GET = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  const order = await Order.findById(id).populate("items.product", "name images");
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let data;
  try {
    data = UpdateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid data", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();
  const { id } = await params;

  const order = await Order.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ order });
});
