"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { csrfFetch } from "@/lib/auth/csrfFetch";

export default function AdminQAPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unanswered");
  const [answering, setAnswering] = useState(null); // id
  const [draft, setDraft] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/qa?filter=${filter}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then((d) => setQuestions(d.questions || []))
      .catch((err) => { console.error("Failed to load Q&A:", err); toast.error("Failed to load questions"); setQuestions([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = async (id) => {
    if (!draft.trim()) return;
    const res = await csrfFetch(`/api/admin/qa/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: draft }),
    });
    if (res.ok) { toast.success("Answer published"); setAnswering(null); setDraft(""); load(); }
    else toast.error("Failed to save answer");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;
    await csrfFetch(`/api/admin/qa/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Product Q&amp;A</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {["unanswered", "published", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-mono-tech uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filter === f ? "border-flame text-flame bg-flame/5" : "border-hairline text-paper-dim hover:border-steel"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? <p className="text-paper-dim">Loading…</p> : questions.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-12 text-center text-paper-dim text-sm">
          No questions in this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q._id} className="border border-hairline rounded-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-paper font-medium text-sm">{q.question}</p>
                  <p className="text-xs text-steel mt-0.5">
                    {q.askerName} · {q.askerEmail} · {new Date(q.createdAt).toLocaleDateString()}
                    {q.product && <span className="ml-2 text-flame">— {q.product.name}</span>}
                  </p>
                </div>
                <button onClick={() => handleDelete(q._id)} className="text-steel hover:text-danger shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {q.answer ? (
                <div className="bg-panel border border-hairline rounded-sm p-3 text-sm text-paper-dim">
                  <span className="text-flame font-mono-tech text-xs mr-2">A:</span>{q.answer}
                </div>
              ) : answering === q._id ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder="Type your answer…"
                    className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-sm text-paper focus:border-flame transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAnswer(q._id)}>
                      <Check className="w-3.5 h-3.5" /> Publish answer
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setAnswering(null); setDraft(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAnswering(q._id); setDraft(""); }}
                  className="text-xs text-flame hover:text-flame-bright"
                >
                  + Write answer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
