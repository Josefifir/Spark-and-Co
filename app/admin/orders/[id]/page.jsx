"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import Link from "next/link";

const FULFILLMENT_OPTIONS = ["unfulfilled", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);

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
    const res = await fetch(`/api/admin/orders/${id}`, {
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
    const res = await fetch(`/api/admin/orders/${id}`, {
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
      </div>
    </div>
  );
}
