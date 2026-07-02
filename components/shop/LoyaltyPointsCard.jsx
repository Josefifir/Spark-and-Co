"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const TIERS = [
  { name: "Bronze", min: 0,    max: 499,  multiplier: "1×",   color: "#b45309" },
  { name: "Silver", min: 500,  max: 1999, multiplier: "1.5×", color: "#94a3b8" },
  { name: "Gold",   min: 2000, max: null, multiplier: "2×",   color: "#fbbf24" },
];

function getTier(lifetimeEarned) {
  if (lifetimeEarned >= 2000) return TIERS[2];
  if (lifetimeEarned >= 500)  return TIERS[1];
  return TIERS[0];
}

export default function LoyaltyPointsCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/loyalty")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-panel rounded-lg border border-hairline p-6 animate-pulse">
      <div className="h-4 bg-panel-raised rounded w-1/3 mb-4" />
      <div className="h-8 bg-panel-raised rounded w-1/2" />
    </div>
  );

  if (!data) return null;

  const dollarValue = (data.redemptionValueCents / 100).toFixed(2);
  const tier = getTier(data.pointsEarned || 0);
  const nextTierPts = tier.max ? tier.max + 1 - (data.pointsEarned || 0) : 0;
  const tierProgress = tier.max
    ? Math.min(100, Math.round(((data.pointsEarned - tier.min) / (tier.max - tier.min + 1)) * 100))
    : 100;

  return (
    <div className="bg-panel rounded-lg border border-hairline p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-flame fill-flame" />
          <h2 className="text-lg font-bold text-paper">Loyalty Points</h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0" style={{ color: tier.color, borderColor: tier.color + "66" }}>
          {tier.name} · {tier.multiplier} pts/$
        </span>
      </div>

      {/* Tier progress bar */}
      {tier.max && (
        <div className="mb-4">
          <div className="h-1.5 bg-panel-raised rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${tierProgress}%`, background: tier.color }} />
          </div>
          <p className="text-xs text-steel mt-1">{nextTierPts} pts to {TIERS[TIERS.indexOf(tier) + 1]?.name}</p>
        </div>
      )}

      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display text-4xl font-bold text-flame">{data.points.toLocaleString()}</span>
        <span className="text-paper-dim">points</span>
      </div>
      <p className="text-sm text-steel mb-6">
        Worth <strong className="text-success">${dollarValue}</strong> at checkout · {(data.pointsEarned || 0).toLocaleString()} earned lifetime
      </p>

      <div className="bg-panel-raised rounded-sm p-3 mb-6 text-sm text-paper-dim">
        <p>💡 Earn <strong className="text-paper">1 point</strong> for every $1 spent ({tier.multiplier} at your tier). Redeem 100 pts = $1 off.</p>
      </div>

      {data.transactions?.length > 0 && (
        <div>
          <h3 className="text-xs font-mono-tech text-steel uppercase tracking-wider mb-3">Recent activity</h3>
          <div className="space-y-2">
            {data.transactions.slice(0, 8).map((tx, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-hairline last:border-0">
                <div>
                  <span className="text-paper-dim">{tx.description}</span>
                  <p className="text-xs text-steel">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`font-mono-tech font-medium ${tx.points > 0 ? "text-success" : "text-danger"}`}>
                  {tx.points > 0 ? "+" : ""}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
