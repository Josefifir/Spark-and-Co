"use client";

import { useEffect, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/payments/stripeClient";
import { Zap } from "lucide-react";

// Inner component — needs to be inside <Elements> to use useStripe
function PaymentRequestButtonInner({ totalCents, currency, onSuccess }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canPay, setCanPay] = useState(false);

  useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: "US",
      currency: (currency || "usd").toLowerCase(),
      total: { label: "Spark & Co.", amount: totalCents },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
    });
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanPay(true);
      }
    });
    pr.on("paymentmethod", async (ev) => {
      try {
        await onSuccess(ev);
      } catch {
        ev.complete("fail");
      }
    });
  }, [stripe, totalCents, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canPay) return null;

  return (
    <button
      type="button"
      onClick={() => paymentRequest.show()}
      className="w-full flex items-center justify-center gap-2 bg-paper text-graphite font-semibold py-3 px-4 rounded-sm hover:bg-paper/90 transition-colors text-sm mb-3"
      aria-label="Pay with Apple Pay or Google Pay"
    >
      <Zap className="w-4 h-4" />
      Pay instantly with Apple Pay / Google Pay
    </button>
  );
}

// Wrapper provides the <Elements> context needed by useStripe
export default function PaymentRequestButton({ totalCents, currency, onSuccess }) {
  return (
    <Elements stripe={getStripe()}>
      <PaymentRequestButtonInner totalCents={totalCents} currency={currency} onSuccess={onSuccess} />
    </Elements>
  );
}
