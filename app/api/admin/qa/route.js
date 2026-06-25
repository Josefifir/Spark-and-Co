import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import ProductQA from "@/lib/models/ProductQA";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const AnswerSchema = z.object({ answer: z.string().min(1).max(2000) });

// GET all unanswered Q&As (admin)
export const GET = requireAdmin(async (request) => {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "unanswered";

  const query = filter === "unanswered"
    ? { answer: null }
    : filter === "published"
    ? { isPublished: true }
    : {};

  const questions = await ProductQA.find(query)
    .populate("product", "name slug")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ questions });
});

export { };
