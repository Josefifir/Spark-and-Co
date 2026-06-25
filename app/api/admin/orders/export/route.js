import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function rowToCsv(fields) {
  return fields.map(escapeCsv).join(",");
}

export const GET = requireAdmin(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status     = searchParams.get("status");       // paymentStatus filter
  const from       = searchParams.get("from");         // ISO date string
  const to         = searchParams.get("to");           // ISO date string
  const fulfillment = searchParams.get("fulfillment"); // fulfillmentStatus filter

  const filter = {};
  if (status)      filter.paymentStatus     = status;
  if (fulfillment) filter.fulfillmentStatus = fulfillment;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

  const headers = [
    "Order Number",
    "Date",
    "Customer Email",
    "Payment Status",
    "Fulfillment Status",
    "Payment Method",
    "Currency",
    "Subtotal",
    "Discount",
    "Shipping",
    "Total",
    "Discount Code",
    "Tracking Number",
    "Shipping Name",
    "Shipping Line1",
    "Shipping Line2",
    "Shipping City",
    "Shipping State",
    "Shipping Postal Code",
    "Shipping Country",
    "Items",
  ];

  const lines = [headers.join(",")];

  for (const o of orders) {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.quantity}x ${it.name}`)
      .join(" | ");

    lines.push(rowToCsv([
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.customerEmail,
      o.paymentStatus,
      o.fulfillmentStatus,
      o.paymentMethod,
      (o.currency || "usd").toUpperCase(),
      (o.subtotalCents / 100).toFixed(2),
      (o.discountAppliedCents / 100).toFixed(2),
      (o.shippingCents / 100).toFixed(2),
      (o.totalCents / 100).toFixed(2),
      o.discountCodeUsed || "",
      o.trackingNumber || "",
      o.shippingAddress?.name || "",
      o.shippingAddress?.line1 || "",
      o.shippingAddress?.line2 || "",
      o.shippingAddress?.city || "",
      o.shippingAddress?.state || "",
      o.shippingAddress?.postalCode || "",
      o.shippingAddress?.country || "",
      itemsSummary,
    ]));
  }

  const csv = lines.join("\n");
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
