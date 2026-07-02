"use client";

import { useEffect, useState } from "react";

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [code] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("exit-intent-dismissed") ? null : "STAY10"
  );

  useEffect(() => {
    if (typeof window === "undefined" || !code) return;
    if (sessionStorage.getItem("exit-intent-dismissed")) return;

    const onMouseLeave = (e) => {
      if (e.clientY <= 0 && !dismissed) {
        setVisible(true);
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [code, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("exit-intent-dismissed", "1");
  };

  const handleUseCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText("STAY10").catch(() => {});
    }
    handleDismiss();
  };

  if (!visible || !code) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-panel border border-hairline rounded-sm max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-steel hover:text-paper transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
        <p className="font-mono-tech text-xs text-flame uppercase tracking-widest mb-3">Wait —</p>
        <h2 className="font-display text-2xl font-bold text-paper mb-3">
          10% off before you go
        </h2>
        <p className="text-paper-dim text-sm mb-6">
          Use code <strong className="text-flame">STAY10</strong> at checkout for 10% off your order. One use only.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleUseCode}
            className="flex-1 bg-flame text-graphite font-semibold py-3 rounded-sm hover:bg-flame-bright transition-colors text-sm"
          >
            Copy code &amp; continue
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 border border-hairline text-steel text-sm rounded-sm hover:text-paper hover:border-steel transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
