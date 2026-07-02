"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ShoppingBag, X } from "lucide-react";

export default function SocialProofPopup() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const showNextRef = useRef(null);

  useEffect(() => {
    fetch("/api/orders/social-proof")
      .then(r => r.json())
      .then(d => setQueue(d.proofs || []))
      .catch(() => {});
  }, []);

  const showNext = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const [item, ...rest] = prev;
      setCurrent(item);
      setVisible(true);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
        // Show next after 15 seconds
        setTimeout(() => { if (showNextRef.current) showNextRef.current(); }, 15000);
      }, 5000);
      return rest;
    });
  }, []);

  // Keep ref in sync so the timeout closure always calls the latest version
  useEffect(() => { showNextRef.current = showNext; }, [showNext]);

  useEffect(() => {
    if (queue.length === 0 || dismissed) return;
    // Show first item after 5 seconds
    const initial = setTimeout(() => showNext(), 5000);
    return () => clearTimeout(initial);
  }, [queue, dismissed, showNext]);

  if (!current || dismissed) return null;

  const timeLabel = current.minutesAgo < 60
    ? `${current.minutesAgo} min ago`
    : `${Math.round(current.minutesAgo / 60)}h ago`;

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-panel border border-hairline rounded-sm shadow-lg flex items-start gap-3 p-3.5 max-w-xs">
        <div className="w-8 h-8 rounded-full bg-flame/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4 text-flame" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-paper leading-snug">
            <span className="font-medium">Someone in {current.city}</span>
            {current.country && current.country !== "US" ? `, ${current.country}` : ""}{" "}
            just bought{" "}
            <span className="font-medium">{current.productName}</span>
            {current.quantity > 1 ? ` ×${current.quantity}` : ""}
          </p>
          <p className="text-[10px] text-steel mt-0.5">{timeLabel}</p>
        </div>
        <button
          onClick={() => { setVisible(false); setDismissed(true); }}
          className="text-steel hover:text-paper shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
