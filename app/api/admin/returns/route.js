import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Return from "@/lib/models/Return";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "label_sent", "received", "refunded"]).optional(),
  adminNote: z.string().max(1000).optional(),
  returnLabelUrl: z.string().url().optional(),
  refundAmountCents: z.number().int().min(0).optional(),
});

// GET all returns (admin)
export const GET = requireAdmin(async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const filter = status ? { status } : {};

  const returns = await Return.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ returns });
});

export { };
