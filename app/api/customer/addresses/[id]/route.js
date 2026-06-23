import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { getCustomerSession } from "@/lib/auth/customerSession";

const AddressSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  line1: z.string().min(1).max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(2).max(2).optional(),
  isDefault: z.boolean().optional(),
});

// PATCH - Update an address
export async function PATCH(request, { params }) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

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

    const address = customer.savedAddresses.id(id);
    
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset all other defaults
    if (body.isDefault) {
      customer.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        address[key] = body[key];
      }
    });

    await customer.save();

    return NextResponse.json({ 
      success: true, 
      address 
    });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// DELETE - Remove an address
export async function DELETE(request, { params }) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  await dbConnect();

  try {
    const customer = await Customer.findById(session.customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const address = customer.savedAddresses.id(id);
    
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If we deleted the default address and there are others, make the first one default
    if (wasDefault && customer.savedAddresses.length > 0) {
      customer.savedAddresses[0].isDefault = true;
    }

    await customer.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}

// Made with Bob