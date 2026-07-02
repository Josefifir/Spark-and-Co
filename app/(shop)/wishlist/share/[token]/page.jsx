import { dbConnect } from "@/lib/db";
import Wishlist from "@/lib/models/Wishlist";
import { notFound } from "next/navigation";
import SharedWishlistClient from "./SharedWishlistClient";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

export async function generateMetadata({ params }) {
  const { token } = await params;
  return {
    title: "Shared Wishlist",
    description: "Browse a curated wishlist on Spark & Co.",
    robots: { index: false }, // shared wishlists should not be indexed
    alternates: { canonical: `${SITE_URL}/wishlist/share/${token}` },
  };
}

async function getSharedWishlist(token) {
  await dbConnect();
  const items = await Wishlist.find({
    shareToken: token,
    shareTokenExp: { $gt: new Date() },
  })
    .populate("product", "name slug priceCents salePriceCents saleEndsAt images category stock")
    .sort({ createdAt: -1 })
    .lean();

  if (!items.length) return null;

  return {
    wishlist: JSON.parse(JSON.stringify(items.map((i) => i.product).filter(Boolean))),
    expiresAt: items[0].shareTokenExp,
  };
}

export default async function SharedWishlistPage({ params }) {
  const { token } = await params;
  const data = await getSharedWishlist(token);
  if (!data) notFound();
  return <SharedWishlistClient wishlist={data.wishlist} expiresAt={data.expiresAt} />;
}
