import { NextResponse } from "next/server";
import { z } from "zod";
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

const UpdateSchema = z.object({
  firstName:         z.string().min(1).max(100).optional(),
  lastName:          z.string().min(1).max(100).optional(),
  phone:             z.string().max(30).optional(),
  preferredCurrency: z.enum(["usd", "eur"]).optional(),
  preferredLocale:   z.enum(["en", "de"]).optional(),
  marketingOptIn:    z.boolean().optional(),
});

export async function PATCH(request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = UpdateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const customer = await Customer.findById(session.customerId);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    Object.assign(customer, body);
    await customer.save();

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Failed to update customer data" }, { status: 500 });
  }
}

// Made with Bob