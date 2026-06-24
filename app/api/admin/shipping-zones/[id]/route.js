import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ShippingZone from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/shipping-zones/[id] - Get single shipping zone
export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const zone = await ShippingZone.findById(params.id);

    if (!zone) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ zone });
  } catch (error) {
    console.error("Error fetching shipping zone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shipping zone" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH /api/admin/shipping-zones/[id] - Update shipping zone
export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const data = await request.json();

    const zone = await ShippingZone.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!zone) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ zone });
  } catch (error) {
    console.error("Error updating shipping zone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shipping zone" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// DELETE /api/admin/shipping-zones/[id] - Delete shipping zone
export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const zone = await ShippingZone.findByIdAndDelete(params.id);

    if (!zone) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Shipping zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipping zone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete shipping zone" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// Made with Bob