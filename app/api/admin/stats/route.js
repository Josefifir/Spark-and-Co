import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import ProductReview from "@/lib/models/ProductReview";
import DiscountCode from "@/lib/models/DiscountCode";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import cache from "@/lib/cache";

const STATS_CACHE_KEY = "admin:stats";
const STATS_CACHE_TTL = 300; // 5 minutes

export const GET = requireAdmin(async () => {
  const cached = await cache.get(STATS_CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  await dbConnect();

  // Date ranges for time-based analytics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Run all analytics queries in parallel
  const [
    // Basic counts
    totalProducts,
    lowStockProducts,
    pendingOrders,
    paidOrders,
    
    // Revenue analytics
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueByCurrency,
    revenueByPaymentMethod,
    
    // Order analytics
    ordersToday,
    ordersThisMonth,
    averageOrderValue,
    ordersByStatus,
    
    // Product analytics
    topProducts,
    productsNeedingRestock,
    
    // Customer analytics
    totalCustomers,
    newCustomersThisMonth,
    repeatCustomers,
    ordersByCountry,
    
    // Discount analytics
    activeDiscounts,
    totalDiscountsGiven,
    topDiscountCodes,
    
    // Review analytics
    totalReviews,
    pendingReviews,
    averageRating,
    topRatedProducts,
    
    // Recent data
    recentOrders,
  ] = await Promise.all([
    // Basic counts
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Order.countDocuments({ paymentStatus: "pending" }),
    Order.countDocuments({ paymentStatus: "paid" }),
    
    // Revenue analytics
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$currency", total: { $sum: "$totalCents" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$paymentMethod", total: { $sum: "$totalCents" }, count: { $sum: 1 } } },
    ]),
    
    // Order analytics
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, avg: { $avg: "$totalCents" } } },
    ]),
    Order.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]),
    
    // Product analytics
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.priceCents", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]),
    Product.find({ isActive: true, stock: { $lte: 10 } })
      .select('name stock')
      .sort({ stock: 1 })
      .limit(10)
      .lean(),
    
    // Customer analytics
    Order.distinct("customerEmail"),
    Order.distinct("customerEmail", { createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $group: { _id: "$customerEmail", orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: "total" },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: {
          _id: "$shippingAddress.country",
          count: { $sum: 1 },
          revenue: { $sum: "$totalCents" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    
    // Discount analytics
    DiscountCode.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { paymentStatus: "paid", discountAppliedCents: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$discountAppliedCents" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", discountCodeUsed: { $ne: null } } },
      { $group: {
          _id: "$discountCodeUsed",
          count: { $sum: 1 },
          totalDiscount: { $sum: "$discountAppliedCents" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    
    // Review analytics
    ProductReview.countDocuments(),
    ProductReview.countDocuments({ status: "pending" }),
    ProductReview.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]),
    ProductReview.aggregate([
      { $match: { status: "approved" } },
      { $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      { $project: {
          productId: "$_id",
          productName: "$productInfo.name",
          avgRating: 1,
          reviewCount: "$count"
        }
      },
    ]),
    
    // Recent orders
    Order.find({}).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  // Cache the assembled result before returning

  // Calculate growth percentages
  const revenueThisMonthValue = revenueThisMonth[0]?.total || 0;
  const revenueLastMonthValue = revenueLastMonth[0]?.total || 0;
  const revenueGrowth = revenueLastMonthValue > 0
    ? ((revenueThisMonthValue - revenueLastMonthValue) / revenueLastMonthValue * 100).toFixed(1)
    : 0;

  const result = {
    // Overview stats
    overview: {
      totalProducts,
      lowStockProducts,
      pendingOrders,
      paidOrders,
      totalRevenueCents: totalRevenue[0]?.total || 0,
      revenueThisMonthCents: revenueThisMonthValue,
      revenueGrowthPercent: parseFloat(revenueGrowth),
      ordersToday,
      ordersThisMonth,
      averageOrderValueCents: Math.round(averageOrderValue[0]?.avg || 0),
    },
    
    // Revenue breakdown
    revenue: {
      byCurrency: revenueByCurrency.map(r => ({
        currency: r._id?.toUpperCase() || 'USD',
        totalCents: r.total,
        orderCount: r.count,
      })),
      byPaymentMethod: revenueByPaymentMethod.map(r => ({
        method: r._id,
        totalCents: r.total,
        orderCount: r.count,
      })),
    },
    
    // Order analytics
    orders: {
      byStatus: ordersByStatus.map(o => ({
        status: o._id,
        count: o.count,
      })),
    },
    
    // Product analytics
    products: {
      topSelling: topProducts.map(p => ({
        productId: p._id,
        name: p.name,
        quantitySold: p.totalQuantity,
        revenueCents: p.totalRevenue,
      })),
      needingRestock: productsNeedingRestock,
    },
    
    // Customer analytics
    customers: {
      total: totalCustomers.length,
      newThisMonth: newCustomersThisMonth.length,
      repeatCustomers: repeatCustomers[0]?.total || 0,
      topCountries: ordersByCountry.map(c => ({
        country: c._id,
        orderCount: c.count,
        revenueCents: c.revenue,
      })),
    },
    
    // Discount analytics
    discounts: {
      activeCount: activeDiscounts,
      totalDiscountGivenCents: totalDiscountsGiven[0]?.total || 0,
      topCodes: topDiscountCodes.map(d => ({
        code: d._id,
        usageCount: d.count,
        totalDiscountCents: d.totalDiscount,
      })),
    },
    
    // Review analytics
    reviews: {
      total: totalReviews,
      pending: pendingReviews,
      averageRating: averageRating[0]?.avg?.toFixed(2) || 0,
      topRatedProducts: topRatedProducts,
    },
    
    // Recent orders (for quick view)
    recentOrders,
  };

  await cache.set(STATS_CACHE_KEY, result, STATS_CACHE_TTL);
  return NextResponse.json(result);
});
