import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";
// No edge — we need Mongoose
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats/stream
 * Server-Sent Events stream of live KPIs.
 * Sends a snapshot immediately on connection, then refreshes every 30 s.
 * Only streams: revenue today, orders today, pending orders, low-stock count.
 */
async function getLiveKPIs() {
  await dbConnect();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenueToday, ordersToday, pendingOrders, lowStock, revenueMonth] =
    await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$totalCents" } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ paymentStatus: "pending" }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalCents" } } },
      ]),
    ]);

  return {
    revenueTodayCents: revenueToday[0]?.total || 0,
    ordersToday,
    pendingOrders,
    lowStock,
    revenueMonthCents: revenueMonth[0]?.total || 0,
    ts: Date.now(),
  };
}

export const GET = requireAdmin(async () => {
  const INTERVAL_MS = 30_000;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          // client disconnected
        }
      };

      // Send initial snapshot immediately
      try {
        const kpis = await getLiveKPIs();
        send(kpis);
      } catch (e) {
        console.error("[SSE] initial KPI fetch error:", e);
      }

      // Then poll on interval
      const interval = setInterval(async () => {
        try {
          const kpis = await getLiveKPIs();
          send(kpis);
        } catch (e) {
          console.error("[SSE] KPI refresh error:", e);
        }
      }, INTERVAL_MS);

      // Clean up when the client disconnects
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering for SSE
    },
  });
});
