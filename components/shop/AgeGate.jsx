"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const AGE_COOKIE = "age_verified";

function setVerifiedCookie() {
  // 30 day expiry, not httpOnly since it's just a UX gate (not a security boundary)
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${AGE_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
}

function hasVerifiedCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith(`${AGE_COOKIE}=`));
}

export default function AgeGate({ children }) {
  const [verified, setVerified] = useState(null); // null = checking, true/false

  useEffect(() => {
    setVerified(hasVerifiedCookie());
  }, []);

  if (verified === null) {
    return <div className="min-h-screen bg-graphite" />;
  }

  if (!verified) {
    return (
      <div className="fixed inset-0 z-50 bg-graphite grain-overlay flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-flame/10 border border-flame/30 flex items-center justify-center">
            <span className="text-2xl text-flame animate-flicker">🔥</span>
          </div>
          <h1 className="font-display text-2xl text-paper mb-3">Age Verification Required</h1>
          <p className="text-paper-dim text-sm leading-relaxed mb-8">
            This site sells lighters and related products. You must be 18 years or older to
            enter. By continuing, you confirm that you meet the minimum age requirement in your
            jurisdiction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setVerifiedCookie();
                setVerified(true);
              }}
            >
              I am 18 or older — Enter
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                window.location.href = "https://www.google.com";
              }}
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
