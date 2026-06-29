"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import StripePaymentForm from "@/components/shop/StripePaymentForm";

// ── Return request form ───────────────────────────────────────────────────────
function ReturnForm({ order, onClose, onSubmitted }) {
  const initialItems = order.items.map((item) => ({
    productName: item.name,
    quantity: item.quantity,
    reason: "",
    selected: false,
  }));
  const [items, setItems] = useState(initialItems);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (i, field, value) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selected = items.filter((it) => it.selected);
    if (selected.length === 0) {
      toast.error("Select at least one item to return.");
      return;
    }
    if (selected.some((it) => !it.reason.trim())) {
      toast.error("Please provide a reason for each selected item.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          items: selected.map(({ productName, quantity, reason }) => ({
            productName,
            quantity,
            reason: reason.trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit return request.");
      } else {
        toast.success("Return request submitted. We'll be in touch shortly.");
        onSubmitted();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline sticky top-0 bg-panel">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-flame" />
            <h2 className="font-display font-bold text-paper">Request a Return</h2>
          </div>
          <button onClick={onClose} className="text-paper-dim hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-paper-dim">
            Select the items you want to return and describe the reason for each one.
          </p>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className={`border rounded-sm p-3 transition-colors ${
                  item.selected ? "border-flame/40 bg-flame/5" : "border-hairline"
                }`}
              >
                {/* Item selector row */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => updateItem(i, "selected", e.target.checked)}
                    className="accent-flame w-4 h-4 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paper truncate">{item.productName}</p>
                    <p className="text-xs text-paper-dim">Qty ordered: {item.quantity}</p>
                  </div>
                </label>

                {/* Expanded controls when selected */}
                {item.selected && (
                  <div className="mt-3 space-y-2 pl-7">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-steel uppercase font-mono-tech w-20 flex-shrink-0">
                        Qty to return
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Math.min(Number(e.target.value), item.quantity))}
                        className="w-20 bg-graphite border border-hairline rounded-sm px-2 py-1 text-paper text-sm focus:border-flame"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-steel uppercase font-mono-tech block mb-1">
                        Reason <span className="text-danger">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={item.reason}
                        onChange={(e) => updateItem(i, "reason", e.target.value)}
                        placeholder="e.g. Wrong size, arrived damaged, not as described…"
                        maxLength={500}
                        required
                        className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !items.some((it) => it.selected)}
              className="flex-1 py-2.5 bg-flame text-graphite text-sm font-semibold rounded-sm hover:bg-flame-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Return Request"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-hairline text-paper-dim text-sm rounded-sm hover:border-steel hover:text-paper transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState(false);
  const [resumeData, setResumeData] = useState(null); // { clientSecret, paymentMethod, orderNumber }
  const [resumeError, setResumeError] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);

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

  useEffect(() => {
    if (params.orderNumber) {
      fetchOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderNumber]);

  async function handleCompletePayment() {
    setResuming(true);
    setResumeError(null);
    try {
      const res = await fetch(`/api/customer/orders/${params.orderNumber}/resume`);
      const data = await res.json();
      if (!res.ok) { setResumeError(data.error || "Failed to resume payment."); return; }
      if (data.paymentMethod === "bitcoin") {
        window.location.href = data.hostedUrl;
        return;
      }
      setResumeData(data);
    } catch {
      setResumeError("Something went wrong. Please try again.");
    } finally {
      setResuming(false);
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
        <p className="text-paper-dim mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
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
          <div className="flex items-center gap-3 shrink-0">
            {order.paymentStatus === "paid" && order.invoiceNumber && (
              <a
                href={`/api/customer/orders/${order.orderNumber}/invoice`}
                download={`invoice-${order.orderNumber}.pdf`}
                className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-paper-dim border border-hairline px-3 py-1.5 rounded-sm hover:border-steel hover:text-paper transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Invoice {order.invoiceNumber}
              </a>
            )}
            <Link
              href="/account/orders"
              className="text-flame hover:text-flame-bright text-xs sm:text-sm font-medium font-mono-tech"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${paymentBadgeClass(order.paymentStatus)}`}>
            Payment: {order.paymentStatus}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${fulfillmentBadgeClass(order.fulfillmentStatus)}`}>
            Fulfillment: {order.fulfillmentStatus}
          </span>
        </div>

        {/* ── Pending payment banner ── */}
        {order.paymentStatus === "pending" && !resumeData && (
          <div className="border border-flame/30 bg-flame/5 rounded-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-paper">Payment not yet completed</p>
              <p className="text-xs text-paper-dim mt-0.5">Your order is reserved. Complete your payment to confirm it.</p>
            </div>
            <button
              onClick={handleCompletePayment}
              disabled={resuming}
              className="shrink-0 px-4 py-2 bg-flame text-graphite text-sm font-medium rounded-sm hover:bg-flame-bright transition-colors disabled:opacity-50"
            >
              {resuming ? "Loading…" : "Complete Payment"}
            </button>
          </div>
        )}

        {resumeError && (
          <p className="text-sm text-danger mb-4">{resumeError}</p>
        )}

        {/* ── Inline Stripe payment form for resumed orders ── */}
        {resumeData?.clientSecret && (
          <div className="border border-hairline rounded-sm p-5 mb-6">
            <p className="text-sm font-medium text-paper mb-4">Complete your payment</p>
            <StripePaymentForm
              clientSecret={resumeData.clientSecret}
              orderNumber={resumeData.orderNumber}
              paymentMethod={resumeData.paymentMethod}
              onSuccess={() => router.push(`/checkout/success?order=${resumeData.orderNumber}`)}
            />
          </div>
        )}

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

      {/* Return request — only visible for paid orders that are processing/shipped/delivered */}
      {order.paymentStatus === "paid" &&
        ["processing", "shipped", "delivered"].includes(order.fulfillmentStatus) && (
          <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
            <h3 className="font-display text-base sm:text-lg font-semibold text-paper mb-2">
              Returns
            </h3>
            {returnSubmitted ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <RotateCcw className="w-4 h-4 flex-shrink-0" />
                Your return request has been submitted. We&apos;ll review it and get back to you shortly.
              </div>
            ) : (
              <>
                <p className="text-sm text-paper-dim mb-4">
                  Not happy with your order? Submit a return request and we&apos;ll take care of it.
                </p>
                <button
                  onClick={() => setShowReturnForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-hairline text-paper-dim text-sm rounded-sm hover:border-flame hover:text-flame transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request a Return
                </button>
              </>
            )}
          </div>
        )}

      {/* Return form modal */}
      {showReturnForm && (
        <ReturnForm
          order={order}
          onClose={() => setShowReturnForm(false)}
          onSubmitted={() => {
            setShowReturnForm(false);
            setReturnSubmitted(true);
          }}
        />
      )}
    </div>
  );
}

// Made with Bob