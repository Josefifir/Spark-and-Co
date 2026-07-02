import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Bundle from "@/lib/models/Bundle";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  discountType: z.enum(["percentage", "fixed_amount"]).optional(),
  discountValue: z.number().min(0).optional(),
  image: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GET = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  const bundle = await Bundle.findById(id).populate("items.product", "name priceCents images slug").lean();
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bundle });
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let body;
  try { body = UpdateSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid data" }, { status: 400 }); }

  await dbConnect();
  const { id } = await params;
  const bundle = await Bundle.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bundle });
});

export const DELETE = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  await Bundle.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
});
