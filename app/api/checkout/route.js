import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { stripe } from "@/lib/payments/stripe";
import { createCoinbaseCharge } from "@/lib/payments/coinbase";
import { generateOrderNumber } from "@/lib/utils-shop";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validateDiscountCode, incrementDiscountCodeUsage, calculateBulkPrice } from "@/lib/utils-pricing";
import { getCurrencyForCountry, convertPrice, getCurrencyConfig, formatPrice } from "@/lib/utils-currency";
import { getCustomerSession } from "@/lib/auth/customerSession";

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1)
    .max(50),
  customerEmail: z.string().email().max(200),
  shippingAddress: z.object({
    name: z.string().min(1).max(200),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(2).max(2), // ISO country code
  }),
  shippingMethod: z.object({
    id: z.string(),
    name: z.string(),
    carrier: z.string().optional(),
    carrierService: z.string().optional(),
    estimatedMinDays: z.number().optional(),
    estimatedMaxDays: z.number().optional(),
    cost: z.number().min(0),
  }).optional(),
  ageVerified: z.literal(true, {
    errorMap: () => ({ message: "Age verification is required to purchase." }),
  }),
  paymentMethod: z.enum(["stripe", "bitcoin", "sepa"]),
  discountCode: z.string().max(20).optional(),
});

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = rateLimit({ key: `checkout:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let body;
  try {
    body = CheckoutSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid checkout data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  // --- Server-side price & stock validation. NEVER trust client-submitted prices. ---
  const productIds = body.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} is unavailable.` },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` },
        { status: 409 }
      );
    }

    // Calculate price with bulk pricing tier
    const bulkPrice = calculateBulkPrice(
      product.priceCents,
      item.quantity,
      product.bulkPricingTiers || []
    );

    orderItems.push({
      product: product._id,
      name: product.name,
      priceCents: bulkPrice.unitPriceCents, // server-trusted price snapshot, with bulk discount
      quantity: item.quantity,
    });
  }

  let subtotalCents = orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  let discountAppliedCents = 0;
  let discountCodeUsed = null;

  // Validate and apply discount code if provided
  if (body.discountCode) {
    const cartItemIds = body.items.map((i) => i.productId);
    const discountValidation = await validateDiscountCode(
      body.discountCode,
      subtotalCents,
      cartItemIds
    );

    if (!discountValidation.valid) {
      return NextResponse.json(
        { error: discountValidation.error },
        { status: 400 }
      );
    }

    discountAppliedCents = discountValidation.discountCents;
    discountCodeUsed = discountValidation.code;
  }

  const shippingCents = body.shippingMethod?.cost || 0;
  const totalCents = Math.max(0, subtotalCents - discountAppliedCents + shippingCents);

  // Determine currency based on shipping country
  const baseCurrency = 'USD'; // Products are stored in USD
  const orderCurrency = getCurrencyForCountry(body.shippingAddress.country);
  const currencyConfig = getCurrencyConfig(orderCurrency);

  // Convert prices if needed
  let finalSubtotalCents = subtotalCents;
  let finalDiscountCents = discountAppliedCents;
  let finalShippingCents = shippingCents;
  let finalTotalCents = totalCents;

  if (orderCurrency !== baseCurrency) {
    finalSubtotalCents = convertPrice(subtotalCents, baseCurrency, orderCurrency);
    finalDiscountCents = convertPrice(discountAppliedCents, baseCurrency, orderCurrency);
    finalShippingCents = convertPrice(shippingCents, baseCurrency, orderCurrency);
    finalTotalCents = convertPrice(totalCents, baseCurrency, orderCurrency);
  }

  // Debug logging - BEFORE validation
  console.log('=== CHECKOUT DEBUG ===');
  console.log('Original (USD):', {
    subtotalCents,
    discountAppliedCents,
    totalCents,
  });
  console.log('Converted:', {
    orderCurrency,
    finalSubtotalCents,
    finalDiscountCents,
    finalTotalCents,
    stripeCode: currencyConfig.stripeCode
  });
  console.log('Payment Method:', body.paymentMethod);
  console.log('======================');

  // Stripe minimum charge amounts (in cents)
  const STRIPE_MINIMUMS = {
    usd: 50,  // $0.50
    eur: 50,  // €0.50
  };

  // Validate minimum charge amount for Stripe/SEPA payments
  if (body.paymentMethod === "stripe" || body.paymentMethod === "sepa") {
    const minAmount = STRIPE_MINIMUMS[currencyConfig.stripeCode] || 50;
    if (finalTotalCents < minAmount) {
      console.log('VALIDATION FAILED: finalTotalCents =', finalTotalCents, '< minAmount =', minAmount);
      return NextResponse.json(
        {
          error: `Order total must be at least ${formatPrice(minAmount, orderCurrency)} for ${body.paymentMethod === "sepa" ? "SEPA" : "card"} payments.`,
          minAmount,
          currency: orderCurrency
        },
        { status: 400 }
      );
    }
  }

  const orderNumber = generateOrderNumber();

  // Check if customer is logged in
  const session = await getCustomerSession();

  const order = await Order.create({
    orderNumber,
    items: orderItems,
    subtotalCents: finalSubtotalCents,
    discountAppliedCents: finalDiscountCents,
    discountCodeUsed,
    shippingCents: finalShippingCents,
    shippingMethod: body.shippingMethod ? {
      name: body.shippingMethod.name,
      carrier: body.shippingMethod.carrier,
      carrierService: body.shippingMethod.carrierService,
      estimatedMinDays: body.shippingMethod.estimatedMinDays,
      estimatedMaxDays: body.shippingMethod.estimatedMaxDays,
      cost: finalShippingCents,
    } : null,
    totalCents: finalTotalCents,
    currency: orderCurrency.toLowerCase(),
    customer: session?.customerId || null, // Link to customer account if logged in
    customerEmail: body.customerEmail,
    shippingAddress: body.shippingAddress,
    ageVerifiedAt: new Date(),
    paymentMethod: body.paymentMethod,
    paymentStatus: "pending",
    estimatedDeliveryDate: body.shippingMethod?.estimatedMaxDays
      ? new Date(Date.now() + body.shippingMethod.estimatedMaxDays * 24 * 60 * 60 * 1000)
      : null,
  });

  // Decrement stock optimistically (reserved) using bulkWrite for better performance
  // A more advanced version would use a short-lived hold/expiry; kept simple here.
  const stockUpdates = orderItems.map(item => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } }
    }
  }));
  
  await Product.bulkWrite(stockUpdates);

  try {
    if (body.paymentMethod === "stripe" || body.paymentMethod === "sepa") {
      // Configure payment method types based on selection
      const paymentMethodTypes = body.paymentMethod === "sepa"
        ? ["sepa_debit"]
        : ["card"];

      // Debug logging
      console.log('Checkout Debug:', {
        subtotalCents,
        discountAppliedCents,
        totalCents,
        orderCurrency,
        finalSubtotalCents,
        finalDiscountCents,
        finalTotalCents,
        stripeCode: currencyConfig.stripeCode
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalTotalCents,
        currency: currencyConfig.stripeCode,
        payment_method_types: paymentMethodTypes,
        receipt_email: body.customerEmail,
        metadata: {
          orderNumber,
          originalCurrency: baseCurrency,
          orderCurrency: orderCurrency,
          paymentType: body.paymentMethod,
        },
        // For SEPA, mandate acceptance is handled by Stripe Elements on the client side
        // No need to pass mandate_data here without confirm: true
      });

      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      // Increment discount code usage after successful payment setup
      if (discountCodeUsed) {
        await incrementDiscountCodeUsage(discountCodeUsed);
      }

      return NextResponse.json({
        orderNumber,
        paymentMethod: body.paymentMethod,
        clientSecret: paymentIntent.client_secret,
        currency: orderCurrency,
      });
    }

    if (body.paymentMethod === "bitcoin") {
      // Coinbase Commerce: convert to USD if needed (they primarily work in USD/crypto)
      const coinbaseAmountCents = orderCurrency === 'USD' ? finalTotalCents : totalCents;
      
      const charge = await createCoinbaseCharge({
        name: `Order ${orderNumber}`,
        description: `${orderItems.length} item(s) from Lighter Shop`,
        amountCents: coinbaseAmountCents,
        currency: "usd", // Coinbase Commerce works best with USD
        orderNumber,
      });

      order.coinbaseChargeId = charge.id;
      order.coinbaseChargeCode = charge.code;
      await order.save();

      // Increment discount code usage after successful payment setup
      if (discountCodeUsed) {
        await incrementDiscountCodeUsage(discountCodeUsed);
      }

      return NextResponse.json({
        orderNumber,
        paymentMethod: "bitcoin",
        hostedUrl: charge.hosted_url,
        currency: orderCurrency,
      });
    }
  } catch (err) {
    // Roll back stock reservation and mark order failed if payment session creation fails
    for (const item of orderItems) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
    order.paymentStatus = "failed";
    await order.save();

    console.error("Payment session creation failed:", err.message);
    return NextResponse.json(
      { error: "Could not initiate payment. Please try again." },
      { status: 502 }
    );
  }
}
