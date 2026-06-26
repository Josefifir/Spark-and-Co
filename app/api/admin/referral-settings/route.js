import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import SiteSettings from "@/lib/models/SiteSettings";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

const SETTINGS_KEY = "referral";

const ReferralSettingsSchema = z.object({
  referralBaseUrl: z.string().max(500).default(""),
  referralRewardCents: z.number().int().min(0),
  referralMinOrderCents: z.number().int().min(0),
});

export const GET = requireAdmin(async () => {
  await dbConnect();

  const doc = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();

  // Return stored values, falling back to env defaults
  return NextResponse.json({
    referralBaseUrl: doc?.referralBaseUrl || process.env.NEXT_PUBLIC_BASE_URL || "",
    referralRewardCents: doc?.referralRewardCents ?? parseInt(process.env.REFERRAL_CREDIT_CENTS || "1000", 10),
    referralMinOrderCents: doc?.referralMinOrderCents ?? 0,
  });
});

export const PUT = requireAdmin(async (request) => {
  await dbConnect();

  const body = await request.json();
  const validated = ReferralSettingsSchema.parse(body);

  const doc = await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: validated },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  return NextResponse.json({
    referralBaseUrl: doc.referralBaseUrl,
    referralRewardCents: doc.referralRewardCents,
    referralMinOrderCents: doc.referralMinOrderCents,
  });
});
