"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

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

  return (
    <div className="bg-panel rounded-lg border border-hairline p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-flame fill-flame" />
        <h2 className="text-lg font-bold text-paper">Loyalty Points</h2>
      </div>

      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display text-4xl font-bold text-flame">{data.points.toLocaleString()}</span>
        <span className="text-paper-dim">points</span>
      </div>
      <p className="text-sm text-steel mb-6">
        Worth <strong className="text-success">${dollarValue}</strong> at checkout · {data.pointsEarned.toLocaleString()} earned lifetime
      </p>

      <div className="bg-panel-raised rounded-sm p-3 mb-6 text-sm text-paper-dim">
        <p>💡 Earn <strong className="text-paper">1 point</strong> for every $1 spent. Redeem 100 points = $1 off any order.</p>
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
