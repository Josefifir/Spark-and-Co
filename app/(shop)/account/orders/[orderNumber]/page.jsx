"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.orderNumber) {
      fetchOrder();
    }
  }, [params.orderNumber]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/customer/orders/${params.orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents, currency = "usd") {
    const amount = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  function paymentBadgeClass(status) {
    const map = {
      paid:      "bg-flame/10 text-flame border border-flame/30",
      pending:   "bg-steel/10 text-paper-dim border border-hairline",
      failed:    "bg-danger/10 text-danger border border-danger/30",
      refunded:  "bg-steel/10 text-paper-dim border border-hairline",
      expired:   "bg-steel/10 text-paper-dim border border-hairline",
      cancelled: "bg-danger/10 text-danger border border-danger/30",
    };
    return map[status] || "bg-steel/10 text-paper-dim border border-hairline";
  }

  function fulfillmentBadgeClass(status) {
    const map = {
      unfulfilled: "bg-steel/10 text-paper-dim border border-hairline",
      processing:  "bg-flame/5 text-flame border border-flame/20",
      shipped:     "bg-flame/10 text-flame border border-flame/30",
      delivered:   "bg-flame/20 text-flame border border-flame/40",
      cancelled:   "bg-danger/10 text-danger border border-danger/30",
    };
    return map[status] || "bg-steel/10 text-paper-dim border border-hairline";
  }

  if (loading) {
    return (
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-panel-raised rounded w-1/4" />
          <div className="h-20 bg-panel-raised rounded" />
          <div className="h-20 bg-panel-raised rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-paper mb-4">Order Not Found</h2>
        <p className="text-paper-dim mb-4">The order you're looking for doesn't exist.</p>
        <Link href="/account/orders" className="text-flame hover:text-flame-bright text-sm">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-paper">Order #{order.orderNumber}</h2>
            <p className="text-xs sm:text-sm text-paper-dim mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Link
            href="/account/orders"
            className="text-flame hover:text-flame-bright text-xs sm:text-sm font-medium font-mono-tech shrink-0"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${paymentBadgeClass(order.paymentStatus)}`}>
            Payment: {order.paymentStatus}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${fulfillmentBadgeClass(order.fulfillmentStatus)}`}>
            Fulfillment: {order.fulfillmentStatus}
          </span>
        </div>

        {/* Order Items */}
        <div className="border-t border-hairline pt-6">
          <h3 className="text-lg font-semibold text-paper mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b border-hairline last:border-0">
                <div className="flex-shrink-0 w-20 h-20 bg-panel-raised rounded-md overflow-hidden flex items-center justify-center">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-steel"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-paper">{item.name}</h4>
                  <p className="text-sm text-paper-dim">Quantity: {item.quantity}</p>
                  <p className="text-sm font-medium text-paper mt-1">
                    {formatPrice(item.priceCents, order.currency)} each
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-paper">
                    {formatPrice(item.priceCents * item.quantity, order.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t border-hairline pt-6 mt-6">
          <h3 className="text-lg font-semibold text-paper mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-paper-dim">Subtotal</span>
              <span className="text-paper">{formatPrice(order.subtotalCents, order.currency)}</span>
            </div>
            {order.discountAppliedCents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-paper-dim">
                  Discount {order.discountCodeUsed && `(${order.discountCodeUsed})`}
                </span>
                <span className="text-green-400">
                  -{formatPrice(order.discountAppliedCents, order.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-hairline">
              <span className="text-paper">Total</span>
              <span className="text-flame">{formatPrice(order.totalCents, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <h3 className="font-display text-base sm:text-lg font-semibold text-paper mb-4">Shipping Information</h3>
        <div className="text-sm text-paper-dim space-y-1">
          <p className="font-medium text-paper">{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
        {order.trackingNumber && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <p className="text-sm font-medium text-paper">Tracking Number</p>
            <p className="text-sm text-paper-dim mt-1">{order.trackingNumber}</p>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <h3 className="font-display text-base sm:text-lg font-semibold text-paper mb-4">Payment Information</h3>
        <div className="text-sm text-paper-dim space-y-2">
          <div className="flex justify-between">
            <span>Payment Method</span>
            <span className="font-medium text-paper capitalize">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Status</span>
            <span className="font-medium text-paper capitalize">{order.paymentStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob