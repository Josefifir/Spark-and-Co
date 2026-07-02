"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import { csrfFetch } from "@/lib/auth/csrfFetch";
import { toast } from "sonner";

const SCORE_COLOR = (score) =>
  score >= 70 ? "text-danger" : score >= 40 ? "text-flame" : "text-success";

export default function AdminFraudPage() {
  const [flags, setFlags] = useState(null);
  const [filter, setFilter] = useState("false"); // "false" = unreviewed

  const load = () => {
    fetch(`/api/admin/fraud?reviewed=${filter}`)
      .then((r) => r.json())
      .then((d) => setFlags(d.flags || []));
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (id, resolution) => {
    const res = await csrfFetch(`/api/admin/fraud/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    });
    if (res.ok) {
      toast.success(`Marked as ${resolution}`);
      load();
    } else {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-5 h-5 text-danger" />
        <h1 className="font-display text-2xl font-bold text-paper">Fraud Review</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {[["false", "Unreviewed"], ["true", "Reviewed"], ["", "All"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs font-mono-tech px-3 py-1.5 rounded-sm border transition-colors ${
              filter === val ? "border-flame text-flame bg-flame/5" : "border-hairline text-paper-dim hover:border-steel"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {flags === null ? (
        <p className="text-paper-dim text-sm">Loading…</p>
      ) : flags.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center">
          <CheckCircle className="w-8 h-8 text-success/50 mx-auto mb-3" />
          <p className="text-paper-dim text-sm">No fraud flags to review.</p>
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panel border-b border-hairline">
              <tr>
                {["Order", "Email", "Score", "Flags", "Total", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left p-3 font-mono-tech text-xs text-steel uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {flags.map((flag) => (
                <tr key={flag._id} className="hover:bg-panel transition-colors align-top">
                  <td className="p-3">
                    {flag.order ? (
                      <Link href={`/admin/orders/${flag.order._id}`} className="text-flame hover:underline font-mono-tech text-xs">
                        {flag.order.orderNumber}
                      </Link>
                    ) : <span className="text-steel">—</span>}
                  </td>
                  <td className="p-3 text-paper-dim text-xs">{flag.email}</td>
                  <td className="p-3">
                    <span className={`font-mono-tech font-bold ${SCORE_COLOR(flag.score)}`}>{flag.score}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {flag.flags.map((f) => (
                        <span key={f} className="text-xs bg-danger/10 text-danger border border-danger/20 px-1.5 py-0.5 rounded font-mono-tech">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-mono-tech text-xs text-paper">
                    {flag.order ? formatPrice(flag.order.totalCents, flag.order.currency) : "—"}
                  </td>
                  <td className="p-3 text-steel text-xs">{new Date(flag.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    {flag.reviewed ? (
                      <span className={`text-xs font-mono-tech ${flag.resolution === "approved" ? "text-success" : flag.resolution === "rejected" ? "text-danger" : "text-flame"}`}>
                        {flag.resolution}
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button onClick={() => resolve(flag._id, "approved")} className="text-xs px-2 py-1 border border-success/40 text-success hover:bg-success/5 rounded-sm transition-colors">Approve</button>
                        <button onClick={() => resolve(flag._id, "rejected")} className="text-xs px-2 py-1 border border-danger/40 text-danger hover:bg-danger/5 rounded-sm transition-colors">Reject</button>
                        <button onClick={() => resolve(flag._id, "escalated")} className="text-xs px-2 py-1 border border-flame/40 text-flame hover:bg-flame/5 rounded-sm transition-colors">Escalate</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
