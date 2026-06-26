"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

export default function TotpPage() {
  const router   = useRouter();
  const [code, setCode]         = useState(["", "", "", "", "", ""]);
  const [error, setError]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(i, val) {
    const cleaned = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = cleaned;
    setCode(next);
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setSubmitting(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/totp-verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code.");
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setSubmitting(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-flame/10 border border-flame/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-flame" />
          </div>
          <h1 className="font-display text-xl font-bold text-paper">Two-factor authentication</h1>
          <p className="text-sm text-paper-dim mt-2 text-center">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6-box OTP input */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-mono-tech text-paper bg-panel border border-hairline rounded-sm focus:border-flame focus:outline-none transition-colors"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || code.join("").length < 6}
          >
            {submitting ? "Verifying…" : "Verify"}
          </Button>
        </form>

        <p className="text-xs text-steel text-center mt-6">
          Code changes every 30 seconds. Make sure your device clock is synced.
        </p>
      </div>
    </div>
  );
}
