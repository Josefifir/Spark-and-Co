import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// Mark this route as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/orders/[id]/generate-label
 * Generate shipping label for an order
 */
export async function POST(request, { params }) {
  // Import carriers dynamically to avoid build-time issues
  const { createDHLShipment } = require("@/lib/carriers/dhl");
  const { createDPDShipment } = require("@/lib/carriers/dpd");
  
  try {
    await requireAdmin(request);
    await dbConnect();

    // Await params in Next.js 15+
    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is paid
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Cannot generate label for unpaid order" },
        { status: 400 }
      );
    }

    // Check if label already exists
    if (order.trackingNumber) {
      return NextResponse.json(
        { error: "Shipping label already generated for this order" },
        { status: 400 }
      );
    }

    // Check if shipping method has carrier info
    if (!order.shippingMethod || !order.shippingMethod.carrier) {
      return NextResponse.json(
        { error: "Order does not have carrier information" },
        { status: 400 }
      );
    }

    const carrier = order.shippingMethod.carrier.toLowerCase();
    let shipmentResult;

    try {
      // Generate label based on carrier
      switch (carrier) {
        case "dhl":
          shipmentResult = await createDHLShipment(order, {
            express: order.shippingMethod.carrierService?.toLowerCase().includes("express"),
          });
          break;

        case "dpd":
          shipmentResult = await createDPDShipment(order, {
            express: order.shippingMethod.carrierService?.toLowerCase().includes("express"),
          });
          break;

        default:
          return NextResponse.json(
            { error: `Carrier ${carrier} is not supported for automatic label generation` },
            { status: 400 }
          );
      }

      // Update order with tracking information
      order.trackingNumber = shipmentResult.trackingNumber;
      order.trackingUrl = shipmentResult.trackingUrl;
      order.shippingLabelUrl = shipmentResult.labelUrl;
      order.fulfillmentStatus = "processing";

      await order.save();

      return NextResponse.json({
        success: true,
        trackingNumber: shipmentResult.trackingNumber,
        trackingUrl: shipmentResult.trackingUrl,
        labelUrl: shipmentResult.labelUrl,
        carrier: shipmentResult.carrier,
      });
    } catch (carrierError) {
      console.error(`${carrier.toUpperCase()} API Error:`, carrierError);
      
      return NextResponse.json(
        {
          error: `Failed to generate ${carrier.toUpperCase()} label: ${carrierError.message}`,
          details: carrierError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate shipping label" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// Made with Bob