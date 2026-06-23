"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/payments/stripeClient";
import Button from "@/components/ui/Button";
import { Lock } from "lucide-react";

function PaymentFormInner({ orderNumber, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderNumber}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please check your details and try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-hairline rounded-sm p-4 bg-panel">
        <PaymentElement />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? "Processing payment..." : "Pay now"}
      </Button>

      <div className="flex items-center gap-2 text-xs text-steel justify-center">
        <Lock className="w-3.5 h-3.5" /> Processed securely by Stripe — we never see your card number.
      </div>
    </form>
  );
}

export default function StripePaymentForm({ clientSecret, orderNumber, onSuccess, paymentMethod = "stripe" }) {
  const options = {
    clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#ff7a1a",
        colorBackground: "#1f2023",
        colorText: "#edeae3",
        colorDanger: "#e5484d",
        fontFamily: "Inter, sans-serif",
        borderRadius: "2px",
      },
    },
    // Configure payment element based on payment method
    ...(paymentMethod === "sepa" && {
      paymentMethodOrder: ["sepa_debit"],
    }),
  };

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentFormInner orderNumber={orderNumber} onSuccess={onSuccess} />
    </Elements>
  );
}
