"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Download, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import Link from "next/link";
import { csrfFetch } from "@/lib/auth/csrfFetch";

const FULFILLMENT_OPTIONS = ["unfulfilled", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  const load = () => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order);
        setTracking(data.order?.trackingNumber || "");
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateFulfillment = async (fulfillmentStatus) => {
    setSaving(true);
    const res = await csrfFetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillmentStatus }),
    });
    if (res.ok) {
      toast.success("Order updated");
      load();
    } else {
      toast.error("Failed to update order");
    }
    setSaving(false);
  };

  const saveTracking = async () => {
    setSaving(true);
    const res = await csrfFetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: tracking }),
    });
    if (res.ok) {
      toast.success("Tracking number saved");
      load();
    } else {
      toast.error("Failed to save tracking number");
    }
    setSaving(false);
  };

  const handleGenerateLabel = async () => {
    if (!confirm("Generate shipping label for this order?")) return;

    setGeneratingLabel(true);
    try {
      const res = await csrfFetch(`/api/admin/orders/${id}/generate-label`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Shipping label generated successfully!");
        load();
      } else {
        toast.error(data.error || "Failed to generate label");
      }
    } catch (error) {
      console.error("Failed to generate label:", error);
      toast.error("Failed to generate shipping label");
    } finally {
      setGeneratingLabel(false);
    }
  };

  if (!order) {
    return <div className="p-8 text-paper-dim">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-paper mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper">{order.orderNumber}</h1>
          <p className="text-sm text-steel mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className="font-mono-tech text-xl text-flame">{formatPrice(order.totalCents, order.currency)}</span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-hairline rounded-sm p-5">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-2">Payment</h2>
          <p className="text-paper capitalize">{order.paymentMethod} — {order.paymentStatus}</p>
        </div>
        <div className="border border-hairline rounded-sm p-5">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-2">Customer</h2>
          <p className="text-paper">{order.customerEmail}</p>
        </div>
      </div>

      <div className="border border-hairline rounded-sm p-5 mb-6">
        <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Shipping address</h2>
        <p className="text-paper-dim text-sm leading-relaxed">
          {order.shippingAddress.name}<br />
          {order.shippingAddress.line1}<br />
          {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
          {order.shippingAddress.country}
        </p>
      </div>

      {order.shippingMethod && (
        <div className="border border-hairline rounded-sm p-5 mb-6">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Shipping Method</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-paper font-medium">{order.shippingMethod.name}</p>
                {order.shippingMethod.carrier && (
                  <p className="text-sm text-paper-dim mt-1">
                    Carrier: {order.shippingMethod.carrier.toUpperCase()}
                    {order.shippingMethod.carrierService && ` - ${order.shippingMethod.carrierService}`}
                  </p>
                )}
                {order.shippingMethod.estimatedMinDays && order.shippingMethod.estimatedMaxDays && (
                  <p className="text-sm text-steel mt-1">
                    Estimated delivery: {order.shippingMethod.estimatedMinDays === order.shippingMethod.estimatedMaxDays
                      ? `${order.shippingMethod.estimatedMinDays} business day${order.shippingMethod.estimatedMinDays > 1 ? 's' : ''}`
                      : `${order.shippingMethod.estimatedMinDays}-${order.shippingMethod.estimatedMaxDays} business days`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono-tech text-paper">
                  {order.shippingCents === 0 ? (
                    <span className="text-flame">FREE</span>
                  ) : (
                    formatPrice(order.shippingCents, order.currency)
                  )}
                </p>
              </div>
            </div>
            {order.estimatedDeliveryDate && (
              <div className="pt-2 border-t border-hairline">
                <p className="text-xs text-steel">
                  Estimated delivery date: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border border-hairline rounded-sm mb-6">
        <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel p-5 border-b border-hairline">
          Items
        </h2>
        <div className="divide-y divide-hairline">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between p-5 text-sm">
              <span className="text-paper">{item.name} × {item.quantity}</span>
              <span className="font-mono-tech text-paper-dim">{formatPrice(item.priceCents * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-hairline rounded-sm p-5 mb-6">
        <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Fulfillment</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {FULFILLMENT_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => updateFulfillment(status)}
              disabled={saving}
              className={`text-xs font-mono-tech uppercase px-3 py-2 rounded-sm border transition-colors ${
                order.fulfillmentStatus === status
                  ? "border-flame text-flame bg-flame/5"
                  : "border-hairline text-paper-dim hover:border-steel"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Label Generation Section */}
        {order.paymentStatus === "paid" && !order.trackingNumber && order.shippingMethod?.carrier && (
          <div className="mb-4 p-4 bg-panel-raised border border-hairline rounded-md">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-flame mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-paper mb-1">
                  Ready to ship with {order.shippingMethod.carrier.toUpperCase()}
                </p>
                <p className="text-xs text-paper-dim mb-3">
                  Generate a shipping label automatically using the carrier API
                </p>
                <Button
                  onClick={handleGenerateLabel}
                  disabled={generatingLabel}
                  size="sm"
                >
                  {generatingLabel ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Generate {order.shippingMethod.carrier.toUpperCase()} Label
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Tracking number"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="1Z999AA10123456784"
              />
            </div>
            <Button onClick={saveTracking} disabled={saving} variant="secondary">
              Save
            </Button>
          </div>
          
          {order.trackingNumber && (
            <div className="p-4 bg-panel-raised rounded border border-hairline">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-steel mb-1">Tracking Information:</p>
                  <p className="font-mono-tech text-sm text-paper">{order.trackingNumber}</p>
                </div>
                {order.shippingMethod?.carrier && (
                  <span className="text-xs px-2 py-1 bg-flame/10 text-flame rounded uppercase">
                    {order.shippingMethod.carrier}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-flame hover:text-flame-bright flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track Shipment
                  </a>
                )}
                {order.shippingLabelUrl && (
                  <a
                    href={order.shippingLabelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-flame hover:text-flame-bright flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Label
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
