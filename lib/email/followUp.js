/**
 * Post-purchase follow-up email scheduler.
 * Schedules three emails after every paid order:
 *   D+3:  Care guide / how to use your lighter
 *   D+14: Check-in / satisfaction
 *   D+30: Restock reminder
 *
 * Uses a lightweight FollowUpEmail model to track scheduled/sent emails.
 * A cron job at /api/admin/cron/follow-up-emails sends the due ones.
 */
import { dbConnect } from "@/lib/db";

const SEQUENCES = [
  { delayDays: 3,  type: "care_guide",    subject: "How to get the most from your Spark & Co. lighter" },
  { delayDays: 14, type: "check_in",      subject: "How are you getting on? 👋" },
  { delayDays: 30, type: "restock",       subject: "Time to restock? Your lighter might be running low 🔥" },
];

export async function scheduleFollowUpEmails(orderId) {
  await dbConnect();
  const { default: Order } = await import("@/lib/models/Order");
  const order = await Order.findById(orderId).select("customerEmail orderNumber").lean();
  if (!order?.customerEmail) return;

  const { default: FollowUpEmail } = await import("@/lib/models/FollowUpEmail");

  const docs = SEQUENCES.map(({ delayDays, type, subject }) => ({
    orderId,
    customerEmail: order.customerEmail,
    orderNumber: order.orderNumber,
    type,
    subject,
    scheduledFor: new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000),
    sent: false,
  }));

  await FollowUpEmail.insertMany(docs, { ordered: false }).catch(() => {});
}
