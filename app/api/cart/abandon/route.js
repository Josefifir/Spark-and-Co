import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import AbandonedCart from "@/lib/models/AbandonedCart";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const CartSchema = z.object({
  sessionId: z.string().min(1).max(64),
  customerEmail: z.string().email().max(200).optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      name: z.string().max(200),
      priceCents: z.number().int().min(0),
      quantity: z.number().int().min(1),
      image: z.string().max(500).optional(),
      slug: z.string().max(200).optional(),
    })
  ).min(1).max(50),
});

// POST — upsert abandoned cart record
export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `cart-track:${ip}`, limit: 30, windowMs: 60_000 });
  if (!limited.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  let body;
  try { body = CartSchema.parse(await request.json()); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  await dbConnect();
  await AbandonedCart.findOneAndUpdate(
    { sessionId: body.sessionId },
    {
      $set: {
        items: body.items,
        lastSeenAt: new Date(),
        ...(body.customerEmail && { customerEmail: body.customerEmail }),
      },
      $setOnInsert: { recoveryEmailSentAt: null, recoveredAt: null },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

// DELETE — mark cart as recovered (called when checkout completes)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  await dbConnect();
  await AbandonedCart.findOneAndUpdate(
    { sessionId },
    { $set: { recoveredAt: new Date(), items: [] } }
  );
  return NextResponse.json({ ok: true });
}
