import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import ProductReview from "@/lib/models/ProductReview";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

export const dynamic = "force-dynamic";

async function getProduct(slug) {
  await dbConnect();
  const product = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) return null;

  let relatedProducts = [];

  // If manual related products are set, use those
  if (product.relatedProductIds && product.relatedProductIds.length > 0) {
    relatedProducts = await Product.find({
      _id: { $in: product.relatedProductIds },
      isActive: true,
    })
      .select("_id slug name priceCents images category")
      .lean()
      .limit(4);
  } else {
    // Otherwise, use category-based fallback
    relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .select("_id slug name priceCents images category")
      .lean()
      .limit(4);
  }

  // Fetch approved reviews
  const reviews = await ProductReview.find({
    product: product._id,
    status: "approved",
  })
    .select("rating title text customerName createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .limit(10);

  return {
    product: JSON.parse(JSON.stringify(product)),
    relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
    reviews: JSON.parse(JSON.stringify(reviews)),
  };
}

export default async function ProductDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data) notFound();

  const reviewToken = await searchParams.then(params => params.reviewToken);

  return (
    <ProductDetailClient
      product={data.product}
      relatedProducts={data.relatedProducts}
      reviews={data.reviews}
      reviewToken={reviewToken}
    />
  );
}
