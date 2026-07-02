"use client";

import { useState } from "react";
import { Mail, Send, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/auth/csrfFetch";

const SEGMENT_LABELS = {
  marketing_opt_in: "Marketing opt-in customers only",
  all: "All customers (ignores opt-out)",
  purchased_category: "Customers who bought from a specific category",
};

const STARTER_TEMPLATES = [
  {
    label: "Flash sale announcement",
    subject: "🔥 Limited time offer — up to 30% off",
    html: `<h2>Limited time offer!</h2><p>We're running a flash sale on selected lighters — save up to 30%.</p><p><a href="{{STORE_URL}}/products">Shop now →</a></p>`,
  },
  {
    label: "New product launch",
    subject: "Just dropped: [Product name]",
    html: `<h2>New arrival!</h2><p>We're excited to introduce [product name] to our collection.</p><p><a href="{{STORE_URL}}/products/[slug]">Check it out →</a></p>`,
  },
  {
    label: "Win-back campaign",
    subject: "We miss you — here's 10% off",
    html: `<h2>It's been a while!</h2><p>Use code <strong>COMEBACK10</strong> for 10% off your next order.</p><p><a href="{{STORE_URL}}/products">Shop now →</a></p>`,
  },
];

export default function AdminEmailCampaignsPage() {
  const [form, setForm] = useState({
    subject: "",
    html: "",
    segment: "marketing_opt_in",
    category: "",
    testEmail: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [isTest, setIsTest] = useState(true);

  const handleSend = async () => {
    if (!form.subject || !form.html) { toast.error("Subject and content are required."); return; }
    if (!confirm(isTest
      ? `Send test email to "${form.testEmail}"?`
      : `Send campaign to all ${SEGMENT_LABELS[form.segment]} customers? This cannot be undone.`
    )) return;

    setSending(true);
    setResult(null);
    try {
      const payload = {
        subject: form.subject,
        html: form.html,
        segment: form.segment,
        ...(form.segment === "purchased_category" && { category: form.category }),
        ...(isTest && form.testEmail && { testEmail: form.testEmail }),
      };
      const res = await csrfFetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to send"); setSending(false); return; }
      setResult(data);
      toast.success(data.test ? `Test email sent to ${form.testEmail}` : `Campaign sent to ${data.sent} recipients`);
    } catch { toast.error("Something went wrong"); }
    finally { setSending(false); }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Mail className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Email Campaigns</h1>
      </div>

      <div className="bg-flame/5 border border-flame/20 rounded-sm p-4 mb-6 flex gap-2">
        <AlertCircle className="w-4 h-4 text-flame shrink-0 mt-0.5" />
        <p className="text-sm text-paper-dim">
          Always test before sending a live campaign. Only customers with <strong>marketing opt-in</strong> enabled will receive campaigns by default.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Starter templates */}
        <div className="border border-hairline rounded-sm p-5">
          <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-3">Starter templates</h2>
          <div className="flex flex-wrap gap-2">
            {STARTER_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => setForm(f => ({ ...f, subject: tpl.subject, html: tpl.html }))}
                className="text-xs border border-hairline rounded-sm px-3 py-1.5 text-paper-dim hover:border-flame hover:text-flame transition-colors"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign form */}
        <Input label="Subject line" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Email HTML</label>
          <textarea
            value={form.html}
            onChange={e => setForm(f => ({ ...f, html: e.target.value }))}
            rows={10}
            placeholder="Paste your HTML email content here…"
            className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-y font-mono text-xs"
          />
        </div>

        {/* Segment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Recipient segment</label>
          <select
            value={form.segment}
            onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
            className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
          >
            {Object.entries(SEGMENT_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {form.segment === "purchased_category" && (
          <Input label="Category slug" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. torch-lighters" />
        )}

        {/* Test vs live toggle */}
        <div className="border border-hairline rounded-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
              <input type="radio" name="sendMode" checked={isTest} onChange={() => setIsTest(true)} className="accent-flame" />
              Send test email only
            </label>
            <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
              <input type="radio" name="sendMode" checked={!isTest} onChange={() => setIsTest(false)} className="accent-flame" />
              Send to live segment
            </label>
          </div>
          {isTest && (
            <Input label="Test email address" type="email" value={form.testEmail} onChange={e => setForm(f => ({ ...f, testEmail: e.target.value }))} placeholder="your@email.com" required={isTest} />
          )}
        </div>

        {result && (
          <div className="bg-success/5 border border-success/20 rounded-sm p-4 text-sm text-success">
            ✅ {result.test ? `Test email sent to ${form.testEmail}` : `Campaign sent to ${result.sent} recipients`}
          </div>
        )}

        <Button onClick={handleSend} disabled={sending} className="self-start">
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : isTest ? "Send test" : "Send campaign"}
        </Button>
      </div>
    </div>
  );
}
