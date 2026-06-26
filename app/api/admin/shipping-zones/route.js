import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ShippingZone from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/shipping-zones - List all shipping zones
export const GET = requireAdmin(async () => {
  await dbConnect();
  const zones = await ShippingZone.find().sort({ priority: -1, name: 1 });
  return NextResponse.json({ zones });
});

// POST /api/admin/shipping-zones - Create new shipping zone
export const POST = requireAdmin(async (request) => {
  await dbConnect();

  const data = await request.json();

  // Validate required fields
  if (!data.name || !data.countries || data.countries.length === 0) {
    return NextResponse.json(
      { error: "Name and at least one country are required" },
      { status: 400 }
    );
  }

  try {
    const zone = await ShippingZone.create(data);
    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A shipping zone with this name already exists" },
        { status: 400 }
      );
    }
    throw error;
  }
});

// Made with Bob
