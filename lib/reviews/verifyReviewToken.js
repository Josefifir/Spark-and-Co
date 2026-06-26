import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set.");
}

export async function verifyReviewToken(token) {
  try {
    if (!token || typeof token !== "string") {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    // Verify JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return {
          valid: false,
          error: "Review link has expired. Please request a new one from your order confirmation.",
        };
      }
      return {
        valid: false,
        error: "Invalid review link",
      };
    }

    const { orderNumber, email, productId } = decoded;

    // Validate decoded fields
    if (!orderNumber || !email || !productId) {
      return {
        valid: false,
        error: "Invalid token data",
      };
    }

    // Verify order exists and is paid
    await dbConnect();

    const order = await Order.findOne({
      orderNumber,
      customerEmail: email.toLowerCase(),
      paymentStatus: "paid",
    });

    if (!order) {
      return {
        valid: false,
        error: "Order not found or not yet paid. Only customers with completed purchases can leave reviews.",
      };
    }

    // Verify product is in the order
    const productInOrder = order.items.some((item) => item.product.toString() === productId);

    if (!productInOrder) {
      return {
        valid: false,
        error: "This product was not in your order.",
      };
    }

    return {
      valid: true,
      orderNumber,
      email: email.toLowerCase(),
      productId,
    };
  } catch (error) {
    console.error("Error verifying review token:", error);
    return {
      valid: false,
      error: "Error verifying review link. Please try again.",
    };
  }
}
