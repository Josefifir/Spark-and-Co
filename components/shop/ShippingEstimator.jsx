"use client";

import { useState, useEffect, useRef } from "react";
import { Truck, ChevronDown } from "lucide-react";
import { getData } from "country-list";

const COUNTRIES = getData().map(({ code, name }) => ({ code, name }));

export default function ShippingEstimator({ priceCents }) {
  const [country, setCountry] = useState("US");
  const [postalCode, setPostalCode] = useState("");
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const calculate = async (countryCode, postal) => {
    if (!countryCode || !postal || postal.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            country: countryCode,
            postalCode: postal,
            city: "",
          },
          orderDetails: {
            subtotalCents: priceCents,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) setRates(data.rates || []);
      else setError("Could not calculate shipping for this location.");
    } catch {
      setError("Could not calculate shipping.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (postalCode.length >= 3) {
      debounceRef.current = setTimeout(() => calculate(country, postalCode), 600);
    } else {
      setRates(null);
    }
    return () => clearTimeout(debounceRef.current);
  }, [country, postalCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-6 border border-hairline rounded-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4 text-steel" />
        <span className="text-xs font-mono-tech uppercase tracking-wider text-steel">
          Shipping Estimate
        </span>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setRates(null); }}
            className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-sm text-paper appearance-none focus:border-flame transition-colors pr-8"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steel pointer-events-none" />
        </div>
        <input
          type="text"
          placeholder="Post code"
          value={postalCode}
          onChange={e => setPostalCode(e.target.value)}
          className="w-28 bg-graphite border border-hairline rounded-sm px-3 py-2 text-sm text-paper focus:border-flame transition-colors"
        />
      </div>

      {loading && <p className="text-xs text-steel">Calculating…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
      {rates && rates.length === 0 && <p className="text-xs text-steel">No shipping available to this location.</p>}
      {rates && rates.length > 0 && (
        <div className="space-y-1.5">
          {rates.map((rate, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-paper-dim">{rate.name}</span>
              <span className="font-mono-tech text-paper">
                {rate.cost === 0 ? "Free" : `$${(rate.cost / 100).toFixed(2)}`}
                {rate.estimatedMinDays && rate.estimatedMaxDays
                  ? ` · ${rate.estimatedMinDays}–${rate.estimatedMaxDays} days`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
