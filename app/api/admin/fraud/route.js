import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import FraudFlag from "@/lib/models/FraudFlag";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

// GET /api/admin/fraud — list fraud flags, newest first
export const GET = requireAdmin(async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const reviewed = searchParams.get("reviewed"); // "true" | "false" | undefined

  const filter = {};
  if (reviewed === "false") filter.reviewed = false;
  if (reviewed === "true") filter.reviewed = true;

  const flags = await FraudFlag.find(filter)
    .populate("order", "orderNumber totalCents currency customerEmail paymentStatus fulfillmentStatus createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ flags });
});

const ReviewSchema = z.object({
  resolution: z.enum(["approved", "rejected", "escalated"]),
  reviewNote: z.string().max(500).optional(),
});

// PATCH /api/admin/fraud/[id] — mark reviewed
export const PATCH = requireAdmin(async (request, { params }) => {
  let data;
  try {
    data = ReviewSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await dbConnect();
  const { id } = await params;
  const flag = await FraudFlag.findByIdAndUpdate(
    id,
    { reviewed: true, resolution: data.resolution, reviewNote: data.reviewNote || "", reviewedAt: new Date() },
    { new: true }
  );
  if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ flag });
});
