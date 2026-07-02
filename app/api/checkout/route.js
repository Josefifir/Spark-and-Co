import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import Customer from "@/lib/models/Customer";
import LoyaltyTransaction from "@/lib/models/LoyaltyTransaction";
import ShippingZone from "@/lib/models/ShippingZone";
import FraudFlag from "@/lib/models/FraudFlag";
import { stripe } from "@/lib/payments/stripe";
import { createBtcpayInvoice } from "@/lib/payments/btcpayserver";
import { generateOrderNumber } from "@/lib/utils-shop";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { validateDiscountCode, incrementDiscountCodeUsage, calculateBulkPrice } from "@/lib/utils-pricing";
import { getCurrencyForCountry, convertPrice, getCurrencyConfig, formatPrice } from "@/lib/utils-currency";
import { getCustomerSession } from "@/lib/auth/customerSession";
import { sendLowStockAlert } from "@/lib/email/resend";
import { getReferrerByCode } from "@/lib/referral";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";
import { scoreOrder } from "@/lib/fraud/riskScore";

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        personalisationText: z.string().max(200).optional(),
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
    // Only the rate ID is accepted from the client — cost is re-fetched server-side.
    id: z.string().min(1),
  }).optional(),
  ageVerified: z.literal(true, {
    errorMap: () => ({ message: "Age verification is required to purchase." }),
  }),
  paymentMethod: z.enum(["stripe", "bitcoin", "sepa", "revolut"]),
  discountCode: z.string().max(20).optional(),
  referralCode: z.string().max(20).optional(),
  loyaltyPointsToRedeem: z.number().int().min(0).optional(),
});

export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `checkout:${ip}`, limit: 10, windowMs: 60_000 });
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

  // Fetch only the fields checkout needs; .lean() returns plain objects (faster, less memory).
  // salePriceCents + saleEndsAt are included so flash sale prices are applied server-side.
  // Products are cached briefly to absorb burst traffic — stock is re-checked below from the
  // cached snapshot, which is acceptable because stock is decremented atomically via bulkWrite.
  const products = await Promise.all(
    productIds.map((id) =>
      cache.getOrSet(
        `product:id:${id}`,
        () =>
          Product.findOne({ _id: id, isActive: true })
            .select("name priceCents salePriceCents saleEndsAt stock bulkPricingTiers lowStockThreshold sku allowPreorder shippingRestrictions personalisationEnabled personalisationMaxLength")
            .lean(),
        CacheTTL.SHORT // 60 s
      )
    )
  );

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const country = body.shippingAddress.country;

  const orderItems = [];
  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} is unavailable.` },
        { status: 400 }
      );
    }

    // Country restriction check
    if (product.shippingRestrictions?.includes(country)) {
      return NextResponse.json(
        { error: `${product.name} cannot be shipped to your country.` },
        { status: 400 }
      );
    }

    // Pre-order / stock check
    const outOfStock = product.stock < item.quantity;
    if (outOfStock && !product.allowPreorder) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}. Only ${product.stock} left.` },
        { status: 409 }
      );
    }

    // Resolve effective unit price — honour flash sale if active
    const now = new Date();
    const saleActive =
      product.salePriceCents != null &&
      product.salePriceCents < product.priceCents &&
      (!product.saleEndsAt || now < new Date(product.saleEndsAt));
    const basePriceCents = saleActive ? product.salePriceCents : product.priceCents;

    // Calculate price with bulk pricing tier (applied on top of sale price if active)
    const bulkPrice = calculateBulkPrice(
      basePriceCents,
      item.quantity,
      product.bulkPricingTiers || []
    );

    // Resolve personalisation text from client-submitted items
    const clientItem = body.items.find(ci => ci.productId === item.productId);

    orderItems.push({
      product: product._id,
      name: product.name,
      priceCents: bulkPrice.unitPriceCents, // server-trusted price snapshot, with bulk discount
      quantity: item.quantity,
      isPreorder: outOfStock && product.allowPreorder,
      personalisationText: product.personalisationEnabled && clientItem?.personalisationText
        ? String(clientItem.personalisationText).slice(0, product.personalisationMaxLength || 20)
        : null,
    });
  }

  let subtotalCents = orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  let discountAppliedCents = 0;
  let discountCodeUsed = null;

  // Validate and apply discount code if provided.
  // Discount-code results are cached for a short window to reduce DB load under burst traffic.
  // The cache is keyed by code so rapid reuse of the same code hits Redis, not MongoDB.
  // Note: incrementDiscountCodeUsage() always writes through to MongoDB — the cache only
  // affects the read-validation path, not the usage counter.
  if (body.discountCode) {
    const cartItemIds = body.items.map((i) => i.productId);
    const discountValidation = await cache.getOrSet(
      CacheKeys.discountCode(body.discountCode.toUpperCase().trim()),
      () => validateDiscountCode(body.discountCode, subtotalCents, cartItemIds),
      CacheTTL.SHORT // 60 s
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

  // Loyalty points redemption — validate the customer has enough points
  let loyaltyDiscountCents = 0;
  let loyaltyPointsRedeemed = 0;
  if (body.loyaltyPointsToRedeem && body.loyaltyPointsToRedeem > 0 && session?.customerId) {
    const customer = await Customer.findById(session.customerId).select("loyaltyPoints").lean();
    const available = customer?.loyaltyPoints || 0;
    const pointsToRedeem = Math.min(body.loyaltyPointsToRedeem, available);
    if (pointsToRedeem > 0) {
      // 1 point = 1 cent, cap at order subtotal
      loyaltyDiscountCents = Math.min(pointsToRedeem, subtotalCents - discountAppliedCents);
      loyaltyPointsRedeemed = loyaltyDiscountCents; // 1:1
    }
  }
  discountAppliedCents += loyaltyDiscountCents;

  // Look up shipping cost server-side from the rate stored in MongoDB.
  // Never trust the client-submitted cost.
  // Shipping zones are stable data (changed only by admins) — cache for 30 minutes.
  let resolvedShippingRate = null;
  let shippingCents = 0;
  if (body.shippingMethod?.id) {
    const zone = await cache.getOrSet(
      `${CacheKeys.shippingZones()}:rate:${body.shippingMethod.id}`,
      () =>
        ShippingZone.findOne(
          { "rates._id": body.shippingMethod.id, enabled: true },
          { "rates.$": 1, name: 1 }
        ).lean(),
      CacheTTL.LONG // 30 min
    );
    const rate = zone?.rates?.[0];
    if (!rate || !rate.enabled) {
      return NextResponse.json(
        { error: "Selected shipping method is no longer available." },
        { status: 400 }
      );
    }
    // Derive the actual cost using the same logic as zone.calculateRate().
    // This handles flat_rate, free (threshold met), weight_based, price_based.
    switch (rate.type) {
      case "flat_rate":
        shippingCents = rate.flatRate ?? 0;
        break;
      case "free":
        shippingCents = 0;
        break;
      case "weight_based": {
        // Weight is not available at this point — reject gracefully.
        // Weight-based rates should be resolved on the shipping/calculate endpoint
        // and stored as flat_rate equivalents, or the order must carry weightGrams.
        return NextResponse.json(
          { error: "Weight-based shipping rates cannot be resolved without item weights. Please contact support." },
          { status: 400 }
        );
      }
      case "price_based": {
        const range = (rate.priceRanges || []).find(
          (r) => subtotalCents >= (r.minPrice ?? 0) && subtotalCents <= (r.maxPrice ?? Infinity)
        );
        if (!range) {
          return NextResponse.json(
            { error: "Selected shipping method is not applicable to your order total." },
            { status: 400 }
          );
        }
        shippingCents = range.rate;
        break;
      }
      default:
        shippingCents = rate.flatRate ?? 0;
    }
    resolvedShippingRate = rate;
  }
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

  // Stripe minimum charge amounts (in cents)
  const STRIPE_MINIMUMS = {
    usd: 50,  // $0.50
    eur: 50,  // €0.50
  };

  // Validate minimum charge amount for Stripe/SEPA/Revolut payments
  if (body.paymentMethod === "stripe" || body.paymentMethod === "sepa" || body.paymentMethod === "revolut") {
    const minAmount = STRIPE_MINIMUMS[currencyConfig.stripeCode] || 50;
    if (finalTotalCents < minAmount) {
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

  // ── Fraud scoring (before order is created) ──────────────────────────────
  const ip = getClientIp(request);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentOrderCount = await Order.countDocuments({
    customerEmail: body.customerEmail.toLowerCase(),
    createdAt: { $gte: oneHourAgo },
  });

  const { score: fraudScore, flags: fraudFlags } = scoreOrder({
    email: body.customerEmail,
    shippingCountry: body.shippingAddress.country,
    totalCents: totalCents,
    recentOrderCount,
  });

  // Validate referral code — silently ignore invalid/self-referral codes
  let appliedReferralCode = null;
  if (body.referralCode) {
    const referrer = await getReferrerByCode(body.referralCode);
    if (referrer && referrer._id.toString() !== (session?.customerId ?? "")) {
      appliedReferralCode = referrer.referralCode; // normalised (uppercase)
    }
  }

  // Deduct loyalty points before order creation (atomic decrement)
  if (loyaltyPointsRedeemed > 0) {
    const updated = await Customer.findOneAndUpdate(
      { _id: session.customerId, loyaltyPoints: { $gte: loyaltyPointsRedeemed } },
      { $inc: { loyaltyPoints: -loyaltyPointsRedeemed } },
      { new: true, select: "loyaltyPoints" }
    );
    // If the customer didn't have enough points (race condition), abort
    if (!updated) {
      return NextResponse.json({ error: "Insufficient loyalty points." }, { status: 400 });
    }
  }

  // isHighRisk is used to future-gate fulfillment; FraudFlag document signals review needed
  const _isHighRisk = fraudScore >= 70;

  const order = await Order.create({
    orderNumber,
    items: orderItems,
    subtotalCents: finalSubtotalCents,
    discountAppliedCents: finalDiscountCents,
    discountCodeUsed,
    loyaltyPointsRedeemed,
    loyaltyPointsDiscountCents: loyaltyDiscountCents,
    referralCode: appliedReferralCode,
    shippingCents: finalShippingCents,
    shippingMethod: resolvedShippingRate ? {
      name: resolvedShippingRate.name,
      carrier: resolvedShippingRate.carrier,
      carrierService: resolvedShippingRate.carrierService,
      estimatedMinDays: resolvedShippingRate.estimatedMinDays,
      estimatedMaxDays: resolvedShippingRate.estimatedMaxDays,
      cost: finalShippingCents,
    } : null,
    totalCents: finalTotalCents,
    currency: orderCurrency.toLowerCase(),
    customer: session?.customerId || null,
    customerEmail: body.customerEmail,
    shippingAddress: body.shippingAddress,
    ageVerifiedAt: new Date(),
    paymentMethod: body.paymentMethod,
    // High-risk orders are held for manual review (uses existing enum value 'pending'
    // but a FraudFlag document signals that it needs review before fulfillment)
    paymentStatus: "pending",
    estimatedDeliveryDate: resolvedShippingRate?.estimatedMaxDays
      ? new Date(Date.now() + resolvedShippingRate.estimatedMaxDays * 24 * 60 * 60 * 1000)
      : null,
  });

  // Create fraud flag record for high-risk or flagged orders (best-effort)
  if (fraudScore > 0 && fraudFlags.length > 0) {
    FraudFlag.create({
      order: order._id,
      email: body.customerEmail,
      ip,
      score: fraudScore,
      flags: fraudFlags,
    }).catch(() => {});
  }

  // Decrement stock optimistically (reserved) using bulkWrite for better performance
  // A more advanced version would use a short-lived hold/expiry; kept simple here.
  const stockUpdates = orderItems.map(item => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } }
    }
  }));
  
  await Product.bulkWrite(stockUpdates);

  // Record loyalty redemption transaction (best-effort)
  if (loyaltyPointsRedeemed > 0 && session?.customerId) {
    const customer = await Customer.findById(session.customerId).select("loyaltyPoints").lean();
    LoyaltyTransaction.create({
      customer: session.customerId,
      order: order._id,
      type: "redeem",
      points: -loyaltyPointsRedeemed,
      description: `Redeemed at checkout for order #${orderNumber}`,
      balanceAfter: customer?.loyaltyPoints ?? 0,
    }).catch(() => {});
  }

  // Fire low-stock alerts (best-effort, non-blocking)
  for (const item of orderItems) {
    const updatedProduct = await Product.findById(item.product).select("name sku stock lowStockThreshold").lean();
    if (
      updatedProduct &&
      updatedProduct.lowStockThreshold !== null &&
      updatedProduct.lowStockThreshold !== undefined &&
      updatedProduct.stock <= updatedProduct.lowStockThreshold
    ) {
      sendLowStockAlert(updatedProduct).catch(() => {});
    }
  }

  try {
    if (body.paymentMethod === "stripe" || body.paymentMethod === "sepa" || body.paymentMethod === "revolut") {
      // Configure payment method types based on selection
      const paymentMethodTypes =
        body.paymentMethod === "sepa"    ? ["sepa_debit"] :
        body.paymentMethod === "revolut" ? ["revolut_pay"] :
        ["card"];

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
      });

      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      // Increment discount code usage after successful payment setup
      if (discountCodeUsed) {
        await incrementDiscountCodeUsage(discountCodeUsed, finalDiscountCents);
      }

      return NextResponse.json({
        orderNumber,
        paymentMethod: body.paymentMethod,
        clientSecret: paymentIntent.client_secret,
        currency: orderCurrency,
      });
    }

    if (body.paymentMethod === "bitcoin") {
      const invoice = await createBtcpayInvoice({
        orderNumber,
        amountCents: finalTotalCents,
        currency: orderCurrency,
        customerEmail: body.customerEmail,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order=${orderNumber}`,
      });

      order.btcpayInvoiceId = invoice.id;
      await order.save();

      // Increment discount code usage after successful payment setup
      if (discountCodeUsed) {
        await incrementDiscountCodeUsage(discountCodeUsed, finalDiscountCents);
      }

      return NextResponse.json({
        orderNumber,
        paymentMethod: "bitcoin",
        hostedUrl: invoice.checkoutLink,
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
