import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Return from "@/lib/models/Return";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "label_sent", "received", "refunded"]).optional(),
  adminNote: z.string().max(1000).optional(),
  returnLabelUrl: z.string().max(500).optional(),
  refundAmountCents: z.number().int().min(0).optional(),
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let body;
  try { body = UpdateSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data." }, { status: 400 }); }

  await dbConnect();
  const { id } = await params;
  const ret = await Return.findByIdAndUpdate(id, body, { new: true });
  if (!ret) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ return: ret });
});
