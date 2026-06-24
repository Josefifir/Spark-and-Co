import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ShippingZone from "@/lib/models/ShippingZone";

// POST /api/shipping/calculate - Calculate shipping rates for an address
export async function POST(request) {
  try {
    await dbConnect();

    const { address, orderDetails } = await request.json();

    // Validate required fields
    if (!address || !address.country) {
      return NextResponse.json(
        { error: "Address with country is required" },
        { status: 400 }
      );
    }

    if (!orderDetails || !orderDetails.subtotalCents) {
      return NextResponse.json(
        { error: "Order details with subtotal are required" },
        { status: 400 }
      );
    }

    // Find all enabled zones sorted by priority
    const zones = await ShippingZone.find({ enabled: true }).sort({ priority: -1 });

    // Find matching zones
    const matchingZones = zones.filter(zone => zone.matchesAddress(address));

    if (matchingZones.length === 0) {
      return NextResponse.json({
        rates: [],
        message: "No shipping available to this location"
      });
    }

    // Calculate rates for all matching zones
    const allRates = [];
    for (const zone of matchingZones) {
      const zoneRates = zone.calculateRate(orderDetails);
      allRates.push(...zoneRates.map(rate => ({
        ...rate,
        zoneName: zone.name,
        zoneId: zone._id,
      })));
    }

    // Sort by cost (free first, then by price)
    allRates.sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return a.cost - b.cost;
    });

    return NextResponse.json({ rates: allRates });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return NextResponse.json(
      { error: "Failed to calculate shipping rates" },
      { status: 500 }
    );
  }
}

// Made with Bob