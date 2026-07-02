import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth/customerSession";
import Wishlist from "@/lib/models/Wishlist";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// POST /api/customer/wishlist/share — generates (or refreshes) a share token
export async function POST() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await dbConnect();

  // Check the customer has at least one wishlist item
  const count = await Wishlist.countDocuments({ customer: session.customerId });
  if (count === 0) {
    return NextResponse.json({ error: "Your wishlist is empty" }, { status: 400 });
  }

  const { token, exp } = Wishlist.generateShareToken(session.customerId);

  // Store the token on all wishlist items belonging to this customer (update many)
  await Wishlist.updateMany(
    { customer: session.customerId },
    { $set: { shareToken: token, shareTokenExp: exp } }
  );

  const shareUrl = `${BASE_URL}/wishlist/share/${token}`;
  return NextResponse.json({ shareUrl, expiresAt: exp });
}
