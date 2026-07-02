/**
 * DutyEstimator — shown at checkout for non-EU countries.
 * Uses a simple threshold lookup to warn customers that import
 * duties may apply. Not a legal guarantee — just a heads-up.
 */
"use client";

import { Info } from "lucide-react";

// De minimis thresholds (USD) — below this, duties typically don't apply
const DE_MINIMIS_USD = {
  US: 800,  GB: 150, CA: 20,  AU: 1000, NZ: 1000,
  CH: 65,   NO: 38,  JP: 100, KR: 150,  SG: 400,
};

// EU handled separately (VAT only, no customs for low value)
const EU_COUNTRIES = new Set(["AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK"]);

export default function DutyEstimator({ country, totalCents }) {
  if (!country || EU_COUNTRIES.has(country)) return null;

  const totalUSD = totalCents / 100;
  const threshold = DE_MINIMIS_USD[country];

  if (threshold && totalUSD < threshold) {
    // Under de minimis — likely duty free
    return null;
  }

  const countryNames = { US: "US", GB: "UK", CA: "Canada", AU: "Australia", NZ: "New Zealand", CH: "Switzerland", NO: "Norway", JP: "Japan", KR: "South Korea", SG: "Singapore" };
  const name = countryNames[country] || country;

  return (
    <div className="flex items-start gap-2 p-3 bg-panel border border-flame/20 rounded-sm mt-3">
      <Info className="w-4 h-4 text-flame shrink-0 mt-0.5" />
      <p className="text-xs text-paper-dim">
        <span className="text-paper font-medium">Import duties may apply.</span>{" "}
        Orders shipped to {name} may be subject to customs duties and taxes upon delivery.
        These are not included in the order total and are the buyer&apos;s responsibility.
      </p>
    </div>
  );
}
