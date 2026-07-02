import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Wishlist from "@/lib/models/Wishlist";

// GET /api/wishlist/public/[token] — no auth required
export async function GET(request, { params }) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  await dbConnect();

  // Find items sharing this token that haven't expired
  const items = await Wishlist.find({
    shareToken: token,
    shareTokenExp: { $gt: new Date() },
  })
    .populate("product", "name slug priceCents salePriceCents saleEndsAt images category stock")
    .sort({ createdAt: -1 })
    .lean();

  if (items.length === 0) {
    return NextResponse.json({ error: "Wishlist not found or link has expired" }, { status: 404 });
  }

  const wishlist = items.map((i) => i.product).filter(Boolean);
  return NextResponse.json({ wishlist, expiresAt: items[0].shareTokenExp });
}
