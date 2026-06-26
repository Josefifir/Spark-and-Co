"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Gift, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-panel border border-hairline rounded-sm p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-sm bg-flame/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-flame" />
      </div>
      <div>
        <p className="text-xs text-steel font-mono-tech uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-paper font-mono-tech">{value}</p>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/customer/referral")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load referral info"))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!data?.url) return;
    navigator.clipboard.writeText(data.url).then(() => {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const formatCredit = (cents) =>
    (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (loading) {
    return (
      <div className="bg-panel rounded-sm border border-hairline p-6 animate-pulse space-y-4">
        <div className="h-4 bg-panel-raised rounded w-1/3" />
        <div className="h-10 bg-panel-raised rounded" />
        <div className="h-4 bg-panel-raised rounded w-1/2" />
      </div>
    );
  }

  if (!data) return null;

  const hasMinOrder = data.minOrderCents > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-panel rounded-sm border border-hairline p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <Gift className="w-5 h-5 text-flame" />
          <h2 className="text-xl font-bold text-paper">Refer a Friend</h2>
        </div>
        <p className="text-sm text-paper-dim">
          Share your unique link. When someone places their first order through it, you earn{" "}
          <span className="text-flame font-medium">{formatCredit(data.rewardPerReferralCents)}</span> in store credit.
          {hasMinOrder && (
            <>
              {" "}Their order must be at least{" "}
              <span className="text-flame font-medium">{formatCredit(data.minOrderCents)}</span> to qualify.
            </>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Users} label="Referrals" value={data.referralCount} />
        <StatCard icon={DollarSign} label="Credit earned" value={formatCredit(data.creditsCents)} />
        <StatCard icon={Gift} label="Reward per referral" value={formatCredit(data.rewardPerReferralCents)} />
      </div>

      {/* Credit balance callout */}
      {data.creditsCents > 0 && (
        <div className="border border-flame/30 bg-flame/5 rounded-sm p-4 text-sm">
          <span className="text-flame font-medium">
            You have {formatCredit(data.creditsCents)} in store credit
          </span>
          <span className="text-paper-dim ml-1">— applied automatically at checkout.</span>
        </div>
      )}

      {/* Referral link */}
      <div className="bg-panel rounded-sm border border-hairline p-5 sm:p-6 space-y-3">
        <p className="text-xs text-steel font-mono-tech uppercase tracking-wider">Your referral link</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={data.url}
            className="flex-1 bg-graphite border border-hairline rounded-sm px-3 py-2 text-sm font-mono-tech text-paper-dim focus:outline-none focus:border-flame transition-colors"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-flame text-graphite text-sm font-medium rounded-sm hover:bg-flame-bright transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-steel">
          Your code: <span className="font-mono-tech text-paper">{data.code}</span>
        </p>
      </div>

      {/* How it works */}
      <div className="bg-panel rounded-sm border border-hairline p-5 sm:p-6">
        <h3 className="text-sm font-medium text-paper mb-4">How it works</h3>
        <ol className="space-y-3 text-sm text-paper-dim">
          {[
            "Share your unique referral link with friends.",
            hasMinOrder
              ? `They visit the store through your link and place an order of at least ${formatCredit(data.minOrderCents)}.`
              : "They visit the store through your link and make a purchase.",
            `You automatically earn ${formatCredit(data.rewardPerReferralCents)} store credit per completed order.`,
            "Your credit balance is applied at checkout — no code needed.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-mono-tech text-flame shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {hasMinOrder && (
          <p className="mt-4 pt-4 border-t border-hairline text-xs text-steel">
            Orders below{" "}
            <span className="font-mono-tech text-paper">{formatCredit(data.minOrderCents)}</span>{" "}
            will not trigger the referral award.
          </p>
        )}
      </div>
    </div>
  );
}
