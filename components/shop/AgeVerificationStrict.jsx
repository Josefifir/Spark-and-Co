"use client";

import { useState } from "react";
import { Shield, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

const AGE_VERIFICATION_KEY = "age-verified-strict";
const MINIMUM_AGE = 18;

export default function AgeVerificationStrict({ onVerified }) {
  const [birthDate, setBirthDate] = useState({
    day: "",
    month: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateAge = (day, month, year) => {
    const today = new Date();
    const birthDateObj = new Date(year, month - 1, day);
    
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  };

  const isValidDate = (day, month, year) => {
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (d < 1 || d > 31) return false;
    if (m < 1 || m > 12) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    
    // Check if date is valid (e.g., not Feb 30)
    const date = new Date(y, m - 1, d);
    return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y;
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);

    const { day, month, year } = birthDate;

    // Validate input
    if (!day || !month || !year) {
      setError("Please enter your complete date of birth");
      setLoading(false);
      return;
    }

    if (!isValidDate(day, month, year)) {
      setError("Please enter a valid date");
      setLoading(false);
      return;
    }

    // Calculate age
    const age = calculateAge(parseInt(day), parseInt(month), parseInt(year));

    if (age < MINIMUM_AGE) {
      setError(`You must be at least ${MINIMUM_AGE} years old to access this site`);
      setLoading(false);
      return;
    }

    // Check if date is in the future
    const birthDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (birthDateObj > new Date()) {
      setError("Birth date cannot be in the future");
      setLoading(false);
      return;
    }

    // Store verification (without storing actual birth date for privacy)
    const verification = {
      verified: true,
      timestamp: new Date().toISOString(),
      // Store only the verification result, not the birth date
      ageVerified: true,
    };

    localStorage.setItem(AGE_VERIFICATION_KEY, JSON.stringify(verification));
    sessionStorage.setItem(AGE_VERIFICATION_KEY, JSON.stringify(verification));

    // Call parent callback
    if (onVerified) {
      onVerified(verification);
    }

    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "");
    
    // Limit length
    let maxLength = 2;
    if (field === "year") maxLength = 4;
    
    const limitedValue = numericValue.slice(0, maxLength);
    
    setBirthDate((prev) => ({
      ...prev,
      [field]: limitedValue,
    }));
    
    setError("");
  };

  const handleKeyPress = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "day" && birthDate.day.length >= 1) {
        document.getElementById("month-input")?.focus();
      } else if (field === "month" && birthDate.month.length >= 1) {
        document.getElementById("year-input")?.focus();
      } else if (field === "year" && birthDate.year.length === 4) {
        handleVerify();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite flex items-center justify-center p-6">
      <div className="bg-panel border border-hairline rounded-sm w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-flame/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-flame" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-paper text-center mb-3">
          Age Verification Required
        </h1>
        
        <p className="text-paper-dim text-center mb-6 text-sm">
          You must be at least {MINIMUM_AGE} years old to access this website.
          Please enter your date of birth to continue.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-2 block">
              Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Day */}
              <div className="flex flex-col gap-1">
                <input
                  id="day-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  value={birthDate.day}
                  onChange={(e) => handleInputChange("day", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "day")}
                  maxLength={2}
                  className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper text-center focus:border-flame transition-colors"
                  aria-label="Day"
                />
                <span className="text-xs text-steel text-center">Day</span>
              </div>

              {/* Month */}
              <div className="flex flex-col gap-1">
                <input
                  id="month-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={birthDate.month}
                  onChange={(e) => handleInputChange("month", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "month")}
                  maxLength={2}
                  className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper text-center focus:border-flame transition-colors"
                  aria-label="Month"
                />
                <span className="text-xs text-steel text-center">Month</span>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-1">
                <input
                  id="year-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  value={birthDate.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, "year")}
                  maxLength={4}
                  className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper text-center focus:border-flame transition-colors"
                  aria-label="Year"
                />
                <span className="text-xs text-steel text-center">Year</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-sm p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading || !birthDate.day || !birthDate.month || !birthDate.year}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Age"}
          </Button>

          <div className="bg-panel-raised border border-hairline rounded-sm p-4 mt-4">
            <p className="text-xs text-steel leading-relaxed">
              <strong className="text-paper-dim">Privacy Notice:</strong> Your date of birth is used only to verify your age.
              We do not store your birth date. Only the verification result and timestamp are saved locally in your browser.
            </p>
          </div>

          <p className="text-xs text-steel text-center mt-4">
            By continuing, you confirm that you are of legal age to purchase tobacco products in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to check if user is already verified
export function isAgeVerified() {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(AGE_VERIFICATION_KEY) || 
                   sessionStorage.getItem(AGE_VERIFICATION_KEY);
    
    if (!stored) return false;
    
    const verification = JSON.parse(stored);
    
    // Check if verification is still valid (within 24 hours for session)
    const verifiedAt = new Date(verification.timestamp);
    const now = new Date();
    const hoursSinceVerification = (now - verifiedAt) / (1000 * 60 * 60);
    
    // Session storage: valid for session
    // Local storage: valid for 30 days
    if (sessionStorage.getItem(AGE_VERIFICATION_KEY)) {
      return verification.verified === true;
    }
    
    if (hoursSinceVerification > 24 * 30) {
      // Expired after 30 days
      localStorage.removeItem(AGE_VERIFICATION_KEY);
      return false;
    }
    
    return verification.verified === true;
  } catch {
    return false;
  }
}

// Made with Bob
