import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import ProductReview from "@/lib/models/ProductReview";
import ProductQA from "@/lib/models/ProductQA";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  const product = await Product.findOne({ slug, isActive: true })
    .select("name description images priceCents category slug")
    .lean();

  if (!product) return {};

  const title = product.name;
  const description = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.name} at Spark & Co.`;
  const image = product.images?.[0] || "/og-default.png";
  const url = `${SITE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [{ url: image, width: 800, height: 800, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

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

  // Fetch approved reviews and published Q&A in parallel
  const [reviews, qaItems] = await Promise.all([
    ProductReview.find({ product: product._id, status: "approved" })
      .select("rating title text customerName orderNumber createdAt")
      .sort({ createdAt: -1 })
      .lean()
      .limit(10),
    ProductQA.find({ product: product._id, isPublished: true })
      .select("question answer")
      .lean()
      .limit(20),
  ]);

  return {
    product: JSON.parse(JSON.stringify(product)),
    relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
    reviews: JSON.parse(JSON.stringify(reviews)),
    qaItems: JSON.parse(JSON.stringify(qaItems)),
  };
}

export default async function ProductDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data) notFound();

  const resolvedSearchParams = await searchParams;
  const reviewToken = resolvedSearchParams?.reviewToken;

  const { product, reviews, qaItems } = data;
  const priceFmt = (product.priceCents / 100).toFixed(2);
  const salePrice = product.salePriceCents
    ? (product.salePriceCents / 100).toFixed(2)
    : null;
  const availability =
    product.stock > 0 || product.allowPreorder
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images || [],
    sku: product.sku || product.slug,
    url: `${SITE_URL}/products/${product.slug}`,
    brand: { "@type": "Brand", name: "Spark & Co." },
    offers: {
      "@type": "Offer",
      priceCurrency: (product.currency || "usd").toUpperCase(),
      price: salePrice || priceFmt,
      availability,
      url: `${SITE_URL}/products/${product.slug}`,
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.averageRating?.toFixed(1) || "5.0",
        reviewCount: product.reviewCount || reviews.length,
      },
      review: reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating },
        author: { "@type": "Person", name: r.customerName || "Verified Buyer" },
        reviewBody: r.text || "",
        datePublished: r.createdAt?.slice(0, 10) || "",
      })),
    }),
  };

  const faqSchema = qaItems?.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: qaItems.map((qa) => ({
          "@type": "Question",
          name: qa.question,
          acceptedAnswer: { "@type": "Answer", text: qa.answer || "" },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ProductDetailClient
        product={data.product}
        relatedProducts={data.relatedProducts}
        reviews={data.reviews}
        reviewToken={reviewToken}
      />
    </>
  );
}
