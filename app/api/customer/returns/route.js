import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Return from "@/lib/models/Return";
import { getCustomerSession } from "@/lib/auth/customerSession";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ReturnSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  items: z.array(z.object({
    productName: z.string().min(1).max(200),
    quantity: z.number().int().min(1),
    reason: z.string().min(5).max(500),
  })).min(1),
});

// POST — customer submits a return request
export async function POST(request) {
  const ip = getClientIp(request);
  const limited = rateLimit({ key: `returns:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body;
  try { body = ReturnSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data.", details: err.errors?.map(e => e.message) }, { status: 400 }); }

  await dbConnect();

  // Verify order exists and belongs to this customer
  const order = await Order.findOne({ orderNumber: body.orderNumber, paymentStatus: "paid" }).lean();
  if (!order) return NextResponse.json({ error: "Order not found or not yet paid." }, { status: 404 });

  // If customer is logged in, verify ownership
  const session = await getCustomerSession();
  if (session && order.customerEmail !== session.email) {
    return NextResponse.json({ error: "Order does not belong to this account." }, { status: 403 });
  }

  // Check no existing return for this order
  const existing = await Return.findOne({ orderNumber: body.orderNumber });
  if (existing) return NextResponse.json({ error: "A return request already exists for this order." }, { status: 409 });

  const ret = await Return.create({
    order: order._id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    items: body.items,
  });

  return NextResponse.json({ return: JSON.parse(JSON.stringify(ret)) }, { status: 201 });
}

// GET — customer views their returns
export async function GET(request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  await dbConnect();
  const returns = await Return.find({ customerEmail: session.email })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ returns: JSON.parse(JSON.stringify(returns)) });
}
