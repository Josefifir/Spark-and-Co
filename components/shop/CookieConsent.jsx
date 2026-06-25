"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Settings } from "lucide-react";
import Button from "@/components/ui/Button";

const COOKIE_CONSENT_KEY = "cookie-consent";
const CONSENT_VERSION = "1.0";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent);
        if (parsed.version !== CONSENT_VERSION) {
          // Version changed, ask for consent again
          setShowBanner(true);
        } else {
          setPreferences(parsed.preferences);
        }
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = async (prefs) => {
    const consent = {
      version: CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));

    // Send to backend for logging (GDPR compliance)
    try {
      await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prefs,
          consentVersion: CONSENT_VERSION,
          locale: navigator.language || "en",
        }),
      });
    } catch (error) {
      console.error("Failed to log consent:", error);
    }

    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key) => {
    if (key === "necessary") return; // Can't disable necessary cookies
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
        <div className="bg-panel border border-hairline rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-flame" />
              <h2 className="font-display text-xl font-bold text-paper">Cookie Settings</h2>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-paper-dim hover:text-paper transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-paper-dim text-sm">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking "Accept All", you consent to our use of cookies.
            </p>

            {/* Necessary Cookies */}
            <div className="border border-hairline rounded-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-paper mb-1">Necessary Cookies</h3>
                  <p className="text-sm text-paper-dim">
                    Required for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-5 h-5 rounded border-hairline opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-steel mt-2">
                Examples: Session management, shopping cart, age verification, security
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="border border-hairline rounded-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-paper mb-1">Analytics Cookies</h3>
                  <p className="text-sm text-paper-dim">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => togglePreference("analytics")}
                    className="w-5 h-5 rounded border-hairline cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-steel mt-2">
                Examples: Google Analytics, page views, user behavior tracking
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="border border-hairline rounded-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-paper mb-1">Marketing Cookies</h3>
                  <p className="text-sm text-paper-dim">
                    Used to track visitors across websites to display relevant advertisements.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => togglePreference("marketing")}
                    className="w-5 h-5 rounded border-hairline cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-steel mt-2">
                Examples: Facebook Pixel, Google Ads, retargeting campaigns
              </p>
            </div>

            {/* Preference Cookies */}
            <div className="border border-hairline rounded-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-paper mb-1">Preference Cookies</h3>
                  <p className="text-sm text-paper-dim">
                    Remember your preferences and settings for a better user experience.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={() => togglePreference("preferences")}
                    className="w-5 h-5 rounded border-hairline cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-steel mt-2">
                Examples: Language preference, currency selection, theme settings
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-hairline flex gap-3">
            <Button onClick={saveCustom} className="flex-1">
              Save Preferences
            </Button>
            <Button onClick={acceptAll} variant="secondary" className="flex-1">
              Accept All
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-panel border-t border-hairline shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Close button — top-right on mobile */}
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-flame shrink-0 mt-0.5 hidden sm:block" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h2 className="font-display text-base sm:text-lg font-bold text-paper">
                We value your privacy
              </h2>
              <button
                onClick={acceptNecessary}
                className="text-paper-dim hover:text-paper transition-colors shrink-0"
                aria-label="Close and accept necessary cookies only"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-paper-dim mb-3 leading-relaxed">
              We use cookies to improve your experience and analyze traffic. See our{" "}
              <a href="/legal/privacy" className="text-flame hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            <div className="flex flex-wrap gap-2">
              <Button onClick={acceptAll} size="sm">
                Accept All
              </Button>
              <Button onClick={acceptNecessary} variant="secondary" size="sm">
                Necessary Only
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="secondary" size="sm">
                <Settings className="w-3.5 h-3.5" /> Customize
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
