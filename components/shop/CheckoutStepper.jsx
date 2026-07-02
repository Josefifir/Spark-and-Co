"use client";

import { Check } from "lucide-react";

const STEPS = ["Contact & Address", "Shipping & Discounts", "Review & Pay"];

export default function CheckoutStepper({ step }) {
  return (
    <nav aria-label="Checkout steps" className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-flame text-graphite"
                    : active
                    ? "border-2 border-flame text-flame"
                    : "border border-hairline text-steel"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-mono-tech hidden sm:block ${
                  active ? "text-paper" : done ? "text-flame" : "text-steel"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? "bg-flame/50" : "bg-hairline"}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
