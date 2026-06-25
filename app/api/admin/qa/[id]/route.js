import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import ProductQA from "@/lib/models/ProductQA";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const AnswerSchema = z.object({ answer: z.string().min(1).max(2000) });

// Answer a question (publishes it)
export const PATCH = requireAdmin(async (request, { params }) => {
  let body;
  try { body = AnswerSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data." }, { status: 400 }); }

  await dbConnect();
  const { id } = await params;
  const qa = await ProductQA.findByIdAndUpdate(
    id,
    { answer: body.answer, answeredAt: new Date(), isPublished: true },
    { new: true }
  );
  if (!qa) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ qa });
});

export const DELETE = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  await ProductQA.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
});
