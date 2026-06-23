"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import Button from "@/components/ui/Button";

function StatusBadge({ status }) {
  const map = {
    paid: { icon: CheckCircle2, color: "text-success", label: "Payment confirmed" },
    pending: { icon: Clock, color: "text-flame", label: "Awaiting payment confirmation" },
    failed: { icon: XCircle, color: "text-danger", label: "Payment failed" },
  };
  const { icon: Icon, color, label } = map[status] || map.pending;
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderNumber) return;

    let attempts = 0;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrder(data.order);
          if (data.order.paymentStatus !== "pending") return;
        }
      } catch {
        // ignore transient errors
      }
      attempts += 1;
      if (attempts < 10 && !cancelled) setTimeout(poll, 3000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (!orderNumber) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-paper mb-3">No order found</h1>
        <Link href="/products"><Button>Continue shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-flame/10 border border-flame/30 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-flame" />
      </div>
      <h1 className="font-display text-3xl font-bold text-paper mb-3">Order placed</h1>
      <p className="text-paper-dim mb-8">
        Order <span className="font-mono-tech text-paper">{orderNumber}</span> has been received.
      </p>

      {order && (
        <div className="border border-hairline rounded-sm p-6 text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status={order.paymentStatus} />
            <span className="font-mono-tech text-flame">{formatPrice(order.totalCents, order.currency)}</span>
          </div>
          <div className="space-y-2 border-t border-hairline pt-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-paper-dim">
                <span>{item.name} × {item.quantity}</span>
              </div>
            ))}
          </div>
          {order.paymentStatus === "pending" && (
            <p className="text-xs text-steel mt-4">
              If you paid with Bitcoin, confirmation can take a few minutes depending on network
              traffic. This page will update automatically — feel free to close it, you&apos;ll get an
              email confirmation.
            </p>
          )}
        </div>
      )}

      <Link href="/products"><Button variant="secondary">Continue shopping</Button></Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-24" />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
