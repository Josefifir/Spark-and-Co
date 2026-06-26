import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { generateInvoicePdf } from "@/lib/invoice/generateInvoicePdf";

export const runtime = "nodejs";

export const GET = requireAdmin(async (_request, { params }) => {
  await dbConnect();
  const { id } = await params;

  const order = await Order.findById(id).lean();
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
});
