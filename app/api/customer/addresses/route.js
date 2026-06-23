import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { getCustomerSession } from "@/lib/auth/customerSession";

const AddressSchema = z.object({
  name: z.string().min(1).max(200),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO 2-letter country code
  isDefault: z.boolean().optional(),
});

// GET - List all saved addresses
export async function GET() {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await dbConnect();

  try {
    const customer = await Customer.findById(session.customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ addresses: customer.savedAddresses || [] });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json({ error: "Failed to get addresses" }, { status: 500 });
  }
}

// POST - Add a new address
export async function POST(request) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = AddressSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid address data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const customer = await Customer.findById(session.customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If this is set as default, unset all other defaults
    if (body.isDefault) {
      customer.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    if (customer.savedAddresses.length === 0) {
      body.isDefault = true;
    }

    customer.savedAddresses.push(body);
    await customer.save();

    const newAddress = customer.savedAddresses[customer.savedAddresses.length - 1];

    return NextResponse.json({ 
      success: true, 
      address: newAddress 
    });
  } catch (error) {
    console.error("Add address error:", error);
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}

// Made with Bob