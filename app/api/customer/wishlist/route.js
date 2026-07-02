import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth/customerSession";
import Wishlist from "@/lib/models/Wishlist";
import Product from "@/lib/models/Product";

// GET /api/customer/wishlist
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ wishlist: [] });

  await dbConnect();
  const items = await Wishlist.find({ customer: session.customerId })
    .populate("product", "name slug priceCents salePriceCents saleEndsAt images category stock")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ wishlist: items.map((i) => ({ ...i.product, wishlistId: i._id })) });
}

// POST /api/customer/wishlist  { productId }
export async function POST(request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await dbConnect();
  const product = await Product.exists({ _id: productId, isActive: true });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await Wishlist.findOneAndUpdate(
    { customer: session.customerId, product: productId },
    { customer: session.customerId, product: productId },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/customer/wishlist?productId=xxx
export async function DELETE(request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await dbConnect();
  await Wishlist.deleteOne({ customer: session.customerId, product: productId });

  return NextResponse.json({ ok: true });
}
