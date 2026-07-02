import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

// GET /api/admin/orders/export?from=2024-01-01&to=2024-12-31&status=shipped
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const status = searchParams.get("status");

  await dbConnect();

  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to + "T23:59:59Z");
  }
  if (status) filter.fulfillmentStatus = status;

  const orders = await Order.find(filter)
    .select("orderNumber createdAt customerEmail shippingAddress items subtotalCents discountAppliedCents shippingCents totalCents currency paymentMethod paymentStatus fulfillmentStatus trackingNumber")
    .lean()
    .limit(5000);

  const rows = [
    [
      "Order Number", "Date", "Email", "Name", "Address", "City", "Postal Code", "Country",
      "Items", "Subtotal", "Discount", "Shipping", "Total", "Currency",
      "Payment Method", "Payment Status", "Fulfillment Status", "Tracking Number",
    ].join(","),
    ...orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString().slice(0, 10),
      `"${o.customerEmail}"`,
      `"${o.shippingAddress?.name || ""}"`,
      `"${o.shippingAddress?.line1 || ""}"`,
      `"${o.shippingAddress?.city || ""}"`,
      `"${o.shippingAddress?.postalCode || ""}"`,
      o.shippingAddress?.country || "",
      o.items?.length || 0,
      (o.subtotalCents / 100).toFixed(2),
      (o.discountAppliedCents / 100).toFixed(2),
      (o.shippingCents / 100).toFixed(2),
      (o.totalCents / 100).toFixed(2),
      (o.currency || "usd").toUpperCase(),
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.fulfillmentStatus || "",
      `"${o.trackingNumber || ""}"`,
    ].join(",")),
  ];

  const csv = rows.join("\n");
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
