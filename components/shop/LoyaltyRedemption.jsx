"use client";

import { useState, useEffect } from "react";
import { Gift } from "lucide-react";

export default function LoyaltyRedemption({ subtotalCents, onRedeem }) {
  const [balance, setBalance] = useState(null);
  const [using, setUsing] = useState(false);

  useEffect(() => {
    fetch("/api/customer/loyalty")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setBalance(d?.balance ?? null))
      .catch(() => {});
  }, []);

  if (balance === null || balance === 0) return null;

  // Cap redemption at 50% of subtotal (prevent 100% free orders)
  const maxRedeemable = Math.min(balance, Math.floor(subtotalCents * 0.5));

  const toggle = () => {
    const next = !using;
    setUsing(next);
    onRedeem(next ? maxRedeemable : 0);
  };

  return (
    <div className="border border-hairline rounded-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-flame shrink-0" />
          <div>
            <p className="text-sm font-medium text-paper">Loyalty points</p>
            <p className="text-xs text-steel mt-0.5">
              You have <span className="text-paper">{balance} pts</span> — worth{" "}
              <span className="text-flame">${(maxRedeemable / 100).toFixed(2)} off</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`h-9 px-3 text-xs font-medium rounded-sm border transition-colors shrink-0 ${
            using
              ? "border-flame bg-flame/10 text-flame"
              : "border-hairline text-steel hover:text-paper hover:border-steel"
          }`}
        >
          {using ? "✓ Applied" : "Use points"}
        </button>
      </div>
      {using && (
        <p className="text-xs text-success mt-2">
          −${(maxRedeemable / 100).toFixed(2)} applied ({maxRedeemable} pts)
        </p>
      )}
    </div>
  );
}
