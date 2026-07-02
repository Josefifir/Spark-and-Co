import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import { sendLowStockAlert } from "@/lib/email/resend";

export const runtime = "nodejs";

// Vercel Cron calls GET with Authorization: Bearer <CRON_SECRET>
// Scans all products daily — emails admin for every product at or below reorder threshold.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Find products where stock is at or below the configured threshold
  const lowStock = await Product.find({
    isActive: true,
    lowStockThreshold: { $exists: true, $ne: null },
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  })
    .select("name sku stock lowStockThreshold")
    .lean();

  if (lowStock.length === 0) {
    return NextResponse.json({ alerted: 0 });
  }

  let alerted = 0;
  for (const product of lowStock) {
    await sendLowStockAlert(product).catch((e) =>
      console.error(`Reorder alert failed for ${product.name}:`, e.message)
    );
    alerted++;
  }

  console.log(`[cron/reorder-alerts] Sent ${alerted} reorder alerts.`);
  return NextResponse.json({ alerted });
}
