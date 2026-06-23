import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Customer from "@/lib/models/Customer";
import { getCustomerSession } from "@/lib/auth/customerSession";

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

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Get customer error:", error);
    return NextResponse.json({ error: "Failed to get customer data" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();
    const customer = await Customer.findById(session.customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'preferredCurrency', 'preferredLocale', 'marketingOptIn'];
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        customer[field] = body[field];
      }
    });

    await customer.save();

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer data" }, { status: 500 });
  }
}

// Made with Bob