import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ProductReview from "@/lib/models/ProductReview";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const UpdateReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().max(500).optional(),
});

export const GET = requireAdmin(async (request) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    
    // Build query
    const query = {};
    
    // Status filter
    const status = searchParams.get("status");
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    
    // Rating filters
    const rating = searchParams.get("rating");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    
    if (rating) {
      query.rating = parseInt(rating);
    } else if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }
    
    // Product filter
    const productId = searchParams.get("productId");
    if (productId) {
      query.product = productId;
    }
    
    // Customer email filter
    const customerEmail = searchParams.get("customerEmail");
    if (customerEmail) {
      query.customerEmail = { $regex: customerEmail, $options: "i" };
    }
    
    // Date range filter
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = endDate;
      }
    }
    
    // Text search
    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { text: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }
    
    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    
    let sortOptions = {};
    if (sortBy === "rating") {
      sortOptions = { rating: sortOrder, createdAt: -1 };
    } else if (sortBy === "productName") {
      sortOptions = { "product.name": sortOrder, createdAt: -1 };
    } else {
      sortOptions = { createdAt: sortOrder };
    }

    const skip = (page - 1) * limit;

    const reviews = await ProductReview.find(query)
      .populate("product", "name slug priceCents")
      .populate("approvedBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ProductReview.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        status,
        rating,
        minRating,
        maxRating,
        productId,
        customerEmail,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
});
