import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getCustomerSession } from "@/lib/auth/customerSession";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePdf";

export const runtime = "nodejs";

/**
 * GET /api/customer/orders/[orderNumber]/invoice
 *
 * Requires a valid customer session and ownership of the order.
 */
export async function GET(_request, { params }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { orderNumber } = await params;

  const order = await Order.findOne({
    orderNumber,
    $or: [{ customer: session.customerId }, { customerEmail: session.email }],
  }).lean();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Invoice only available for paid orders." }, { status: 400 });
  }

  const pdf = await generateInvoicePdf(order);

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      "Content-Length":      String(pdf.length),
    },
  });
}
