"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

function pad(n) { return String(n).padStart(2, "0"); }

export default function FlashSaleBadge({ salePriceCents, saleEndsAt, originalPriceCents, formatPrice }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!saleEndsAt) return;
    const end = new Date(saleEndsAt).getTime();

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft({ h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saleEndsAt]);

  // No sale, or already expired
  if (!salePriceCents || expired || !timeLeft) return null;

  const savings = originalPriceCents - salePriceCents;
  const pct = Math.round((savings / originalPriceCents) * 100);

  return (
    <div className="bg-flame/10 border border-flame/40 rounded-sm px-4 py-3 mb-4 space-y-1.5">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-flame shrink-0" />
        <span className="text-sm font-bold text-flame">Flash Sale — {pct}% off</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono-tech text-2xl text-flame font-medium">
          {formatPrice(salePriceCents, "USD")}
        </span>
        <span className="font-mono-tech text-sm text-steel line-through">
          {formatPrice(originalPriceCents, "USD")}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-paper-dim">
        <span>Ends in</span>
        <span className="font-mono-tech text-paper bg-panel border border-hairline rounded px-1.5 py-0.5">
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </span>
      </div>
    </div>
  );
}
