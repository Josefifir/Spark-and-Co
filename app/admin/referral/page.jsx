"use client";

import { useEffect, useState } from "react";
import { Gift, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/auth/csrfFetch";

export default function ReferralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    referralBaseUrl: "",
    referralRewardCents: 1000,
    referralMinOrderCents: 0,
  });

  useEffect(() => {
    fetch("/api/admin/referral-settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          referralBaseUrl: data.referralBaseUrl || "",
          referralRewardCents: data.referralRewardCents ?? 1000,
          referralMinOrderCents: data.referralMinOrderCents ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load referral settings"))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/referral-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralBaseUrl: form.referralBaseUrl.trim(),
          referralRewardCents: Math.max(0, Math.round(Number(form.referralRewardCents))),
          referralMinOrderCents: Math.max(0, Math.round(Number(form.referralMinOrderCents))),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      toast.success("Referral settings saved");
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = form.referralBaseUrl
    ? `${form.referralBaseUrl.replace(/\/$/, "")}/?ref=YOURCODE`
    : "—";

  if (loading) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-paper mb-8">Referral Settings</h1>
        <p className="text-paper-dim">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Referral Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base URL */}
        <div className="border border-hairline rounded-sm p-5 space-y-4">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel">
            Referral Link Base URL
          </h2>

          <div>
            <label className="block text-sm text-paper mb-1">
              Store base URL
            </label>
            <input
              type="url"
              value={form.referralBaseUrl}
              onChange={(e) => set("referralBaseUrl", e.target.value)}
              placeholder="https://your-store.com"
              className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-sm text-paper focus:outline-none focus:border-flame transition-colors"
            />
            <p className="text-xs text-steel mt-1">
              Referral links will be formatted as:{" "}
              <span className="font-mono-tech text-paper-dim break-all">{previewUrl}</span>
            </p>
          </div>

          {form.referralBaseUrl && (
            <a
              href={previewUrl.replace("YOURCODE", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-flame hover:text-flame-bright"
            >
              <ExternalLink className="w-3 h-3" /> Visit store
            </a>
          )}
        </div>

        {/* Reward Amount */}
        <div className="border border-hairline rounded-sm p-5 space-y-4">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel">
            Referral Award
          </h2>

          <div>
            <label className="block text-sm text-paper mb-1">
              Store credit awarded to referrer (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-steel text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(form.referralRewardCents / 100).toFixed(2)}
                onChange={(e) =>
                  set("referralRewardCents", Math.round(parseFloat(e.target.value || "0") * 100))
                }
                className="w-full bg-graphite border border-hairline rounded-sm pl-7 pr-3 py-2 text-sm text-paper focus:outline-none focus:border-flame transition-colors"
              />
            </div>
            <p className="text-xs text-steel mt-1">
              This credit is added to the referrer&apos;s account when a new customer completes a qualifying order.
            </p>
          </div>
        </div>

        {/* Minimum Order */}
        <div className="border border-hairline rounded-sm p-5 space-y-4">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel">
            Minimum Order Threshold
          </h2>

          <div>
            <label className="block text-sm text-paper mb-1">
              Minimum order amount for new customer (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-steel text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(form.referralMinOrderCents / 100).toFixed(2)}
                onChange={(e) =>
                  set("referralMinOrderCents", Math.round(parseFloat(e.target.value || "0") * 100))
                }
                className="w-full bg-graphite border border-hairline rounded-sm pl-7 pr-3 py-2 text-sm text-paper focus:outline-none focus:border-flame transition-colors"
              />
            </div>
            <p className="text-xs text-steel mt-1">
              {form.referralMinOrderCents === 0
                ? "Any order amount qualifies (no minimum)."
                : `The new customer must spend at least $${(form.referralMinOrderCents / 100).toFixed(2)} for the referrer to earn the award.`}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-flame text-graphite text-sm font-medium rounded-sm hover:bg-flame-bright transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
