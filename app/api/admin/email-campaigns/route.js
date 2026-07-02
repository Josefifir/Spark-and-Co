import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Customer from "@/lib/models/Customer";
import { sendMarketingEmail } from "@/lib/email/resend";

const CampaignSchema = z.object({
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(100_000),
  // Optional segment filter
  segment: z.enum(["all", "marketing_opt_in", "purchased_category"]).default("marketing_opt_in"),
  category: z.string().max(50).optional(), // used when segment = "purchased_category"
  testEmail: z.string().email().max(200).optional(), // if set, only send to this address (test mode)
});

export const POST = requireAdmin(async (request) => {
  let body;
  try { body = CampaignSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data", details: err.errors?.map(e => e.message) }, { status: 400 }); }

  await dbConnect();

  // Test send — only to the provided address
  if (body.testEmail) {
    await sendMarketingEmail([body.testEmail], body.subject, body.html);
    return NextResponse.json({ sent: 1, test: true });
  }

  // Find recipients based on segment
  let emails = [];

  if (body.segment === "all" || body.segment === "marketing_opt_in") {
    const query = body.segment === "marketing_opt_in" ? { marketingOptIn: true } : {};
    const customers = await Customer.find(query).select("email").lean();
    emails = customers.map(c => c.email);
  } else if (body.segment === "purchased_category" && body.category) {
    // Find customers who bought a product in this category
    const Order = (await import("@/lib/models/Order")).default;
    const Product = (await import("@/lib/models/Product")).default;

    const products = await Product.find({ category: body.category }).select("_id").lean();
    const productIds = products.map(p => p._id);

    const orders = await Order.find({
      paymentStatus: "paid",
      "items.product": { $in: productIds },
    }).select("customerEmail").lean();

    const uniqueEmails = [...new Set(orders.map(o => o.customerEmail))];
    // Filter to only those who have marketing opt-in
    const opted = await Customer.find({ email: { $in: uniqueEmails }, marketingOptIn: true }).select("email").lean();
    emails = opted.map(c => c.email);
  }

  if (emails.length === 0) return NextResponse.json({ sent: 0 });

  // Send in batches of 50 (Resend batch limit)
  const BATCH = 50;
  let sent = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    await sendMarketingEmail(batch, body.subject, body.html).catch(e =>
      console.error("Campaign email batch error:", e.message)
    );
    sent += batch.length;
  }

  return NextResponse.json({ sent });
});
