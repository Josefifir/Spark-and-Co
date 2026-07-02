import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import FraudFlag from "@/lib/models/FraudFlag";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const ReviewSchema = z.object({
  resolution: z.enum(["approved", "rejected", "escalated"]),
  reviewNote: z.string().max(500).optional(),
});

// PATCH /api/admin/fraud/[id]
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
