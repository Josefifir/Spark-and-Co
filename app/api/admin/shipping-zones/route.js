import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ShippingZone from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/shipping-zones - List all shipping zones
export async function GET(request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const zones = await ShippingZone.find().sort({ priority: -1, name: 1 });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shipping zones" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST /api/admin/shipping-zones - Create new shipping zone
export async function POST(request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.countries || data.countries.length === 0) {
      return NextResponse.json(
        { error: "Name and at least one country are required" },
        { status: 400 }
      );
    }

    const zone = await ShippingZone.create(data);

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping zone:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A shipping zone with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create shipping zone" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// Made with Bob