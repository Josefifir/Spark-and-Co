import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/orders/[id]/generate-label
 * Generate shipping label for an order
 */
export const POST = requireAdmin(async (request, { params }) => {
  const { createDHLShipment } = require("@/lib/carriers/dhl");
  const { createDPDShipment } = require("@/lib/carriers/dpd");

  await dbConnect();
  const { id } = await params;
  const order = await Order.findById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Cannot generate label for unpaid order" },
      { status: 400 }
    );
  }

  if (order.trackingNumber) {
    return NextResponse.json(
      { error: "Shipping label already generated for this order" },
      { status: 400 }
    );
  }

  if (!order.shippingMethod?.carrier) {
    return NextResponse.json(
      { error: "Order does not have carrier information" },
      { status: 400 }
    );
  }

  const carrier = order.shippingMethod.carrier.toLowerCase();
  const isExpress = order.shippingMethod.carrierService?.toLowerCase().includes("express");

  let shipmentResult;
  try {
    switch (carrier) {
      case "dhl":
        shipmentResult = await createDHLShipment(order, { express: isExpress });
        break;
      case "dpd":
        shipmentResult = await createDPDShipment(order, { express: isExpress });
        break;
      default:
        return NextResponse.json(
          { error: `Carrier ${carrier} is not supported for automatic label generation` },
          { status: 400 }
        );
    }
  } catch (carrierError) {
    console.error(`${carrier.toUpperCase()} API Error:`, carrierError);
    return NextResponse.json(
      { error: `Failed to generate ${carrier.toUpperCase()} label: ${carrierError.message}` },
      { status: 500 }
    );
  }

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
});
