import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import ProductQA from "@/lib/models/ProductQA";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const AskSchema = z.object({
  question: z.string().min(5).max(500),
  askerName: z.string().min(1).max(100),
  askerEmail: z.string().email().max(200),
});

// GET published Q&As for a product
export async function GET(request, { params }) {
  const { slug } = await params;
  await dbConnect();
  const product = await Product.findOne({ slug, isActive: true }).select("_id").lean();
  if (!product) return NextResponse.json({ questions: [] });

  const questions = await ProductQA.find({ product: product._id, isPublished: true })
    .select("question answer askerName answeredAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ questions: JSON.parse(JSON.stringify(questions)) });
}

// POST a new question
export async function POST(request, { params }) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `qa:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { slug } = await params;

  let body;
  try {
    body = AskSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid data.", details: err.errors?.map(e => e.message) }, { status: 400 });
  }

  await dbConnect();
  const product = await Product.findOne({ slug, isActive: true }).select("_id").lean();
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await ProductQA.create({ product: product._id, ...body });
  return NextResponse.json({ success: true }, { status: 201 });
}
