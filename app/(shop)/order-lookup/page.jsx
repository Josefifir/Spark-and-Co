"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function OrderLookupPage() {
  const [formData, setFormData] = useState({
    email: "",
    orderNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || "Order not found");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents, currency = "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  }

  const STATUS_STYLES = {
    pending:   "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    paid:      "bg-success/10 text-success border border-success/30",
    failed:    "bg-danger/10 text-danger border border-danger/30",
    refunded:  "bg-steel/10 text-steel border border-steel/30",
    expired:   "bg-steel/10 text-steel border border-steel/30",
    cancelled: "bg-danger/10 text-danger border border-danger/30",
  };
  const FULFILL_STYLES = {
    unfulfilled: "bg-steel/10 text-steel border border-steel/30",
    processing:  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    shipped:     "bg-accent/10 text-accent border border-accent/30",
    delivered:   "bg-success/10 text-success border border-success/30",
    cancelled:   "bg-danger/10 text-danger border border-danger/30",
  };

  function statusBadge(label, map, value) {
    const cls = map[value] || "bg-steel/10 text-steel border border-steel/30";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-mono-tech uppercase tracking-wider ${cls}`}>
        {label}: {value}
      </span>
    );
  }

  function handleReset() {
    setOrder(null);
    setError("");
    setFormData({ email: "", orderNumber: "" });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-paper mb-2">Track Your Order</h1>
      <p className="text-paper-dim text-sm mb-10">Enter your email and order number to view your order status.</p>

      {!order ? (
        <div className="border border-hairline rounded-sm p-6 sm:p-8 max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono-tech uppercase tracking-wider text-steel mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper text-sm focus:border-flame focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="orderNumber" className="block text-xs font-mono-tech uppercase tracking-wider text-steel mb-1.5">
                Order Number
              </label>
              <input
                id="orderNumber"
                type="text"
                required
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper text-sm focus:border-flame focus:outline-none transition-colors"
                placeholder="ORD-123456"
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-sm p-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Looking up order..." : "Track Order"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-steel text-center">
            Have an account?{" "}
            <Link href="/login" className="text-flame hover:text-flame-bright underline">
              Sign in to view all your orders
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="border border-hairline rounded-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-paper">Order #{order.orderNumber}</h2>
                <p className="text-xs text-steel mt-1 font-mono-tech">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-flame hover:text-flame-bright transition-colors shrink-0"
              >
                ← New lookup
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusBadge("Payment", STATUS_STYLES, order.paymentStatus)}
              {statusBadge("Fulfillment", FULFILL_STYLES, order.fulfillmentStatus)}
            </div>
          </div>

          {/* Items */}
          <div className="border border-hairline rounded-sm divide-y divide-hairline">
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel px-5 py-3">Order Items</h3>
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 p-5">
                {item.product?.images?.[0] && (
                  <div className="shrink-0 w-16 h-16 bg-panel border border-hairline rounded-sm overflow-hidden relative">
                    <Image
                      src={item.product.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-paper truncate">{item.name}</p>
                  <p className="text-xs text-steel mt-0.5">Qty: {item.quantity}</p>
                  <p className="text-xs font-mono-tech text-paper-dim mt-0.5">
                    {formatPrice(item.priceCents, order.currency)} each
                  </p>
                </div>
                <p className="font-mono-tech text-paper shrink-0">
                  {formatPrice(item.priceCents * item.quantity, order.currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-hairline rounded-sm p-5 space-y-2 text-sm">
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Order Summary</h3>
            <div className="flex justify-between text-paper-dim">
              <span>Subtotal</span>
              <span className="font-mono-tech">{formatPrice(order.subtotalCents, order.currency)}</span>
            </div>
            {order.discountAppliedCents > 0 && (
              <div className="flex justify-between text-flame">
                <span>Discount {order.discountCodeUsed && `(${order.discountCodeUsed})`}</span>
                <span className="font-mono-tech">−{formatPrice(order.discountAppliedCents, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-paper border-t border-hairline pt-2 mt-2">
              <span>Total</span>
              <span className="font-mono-tech">{formatPrice(order.totalCents, order.currency)}</span>
            </div>
          </div>

          {/* Shipping */}
          <div className="border border-hairline rounded-sm p-5 text-sm">
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Shipping Address</h3>
            <div className="text-paper-dim space-y-0.5">
              <p className="text-paper font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-hairline">
                <p className="text-xs font-mono-tech uppercase tracking-wider text-steel mb-1">Tracking Number</p>
                <p className="text-paper font-mono-tech text-sm">{order.trackingNumber}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="border border-hairline rounded-sm p-5 text-sm">
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Payment</h3>
            <div className="space-y-1.5 text-paper-dim">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="text-paper capitalize font-mono-tech">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-paper capitalize font-mono-tech">{order.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm text-paper-dim hover:text-paper transition-colors">
          ← Back to shop
        </Link>
      </div>
    </div>
  );
}

// Made with Bob
