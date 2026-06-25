"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProductQA({ slug }) {
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", askerName: "", askerEmail: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${slug}/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit question."); setSubmitting(false); return; }
      setSubmitted(true);
    } catch { setError("Something went wrong."); }
    finally { setSubmitting(false); }
  };

  return (
    <section className="mt-12 pt-10 border-t border-hairline">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-paper flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-flame" />
          Questions &amp; Answers
          {questions.length > 0 && <span className="text-sm font-normal text-steel">({questions.length})</span>}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-flame hover:text-flame-bright flex items-center gap-1"
        >
          Ask a question {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="bg-panel border border-hairline rounded-sm p-4 space-y-3 mb-6">
          <Input
            label="Your question"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Your name" value={form.askerName} onChange={(e) => setForm((f) => ({ ...f, askerName: e.target.value }))} required />
            <Input label="Email" type="email" value={form.askerEmail} onChange={(e) => setForm((f) => ({ ...f, askerEmail: e.target.value }))} required />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Submitting…" : "Submit question"}</Button>
        </form>
      )}

      {submitted && (
        <div className="bg-panel border border-hairline rounded-sm p-4 mb-6 text-sm text-success">
          Question submitted! We'll answer it shortly.
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-paper-dim">No questions yet. Be the first to ask!</p>
      ) : (
        <div className="space-y-5">
          {questions.map((q) => (
            <div key={q._id} className="border border-hairline rounded-sm p-4">
              <p className="text-sm font-medium text-paper mb-1">Q: {q.question}</p>
              <p className="text-xs text-steel mb-3">Asked by {q.askerName}</p>
              {q.answer ? (
                <div className="bg-graphite rounded-sm p-3 mt-2">
                  <p className="text-xs font-mono-tech text-flame mb-1">A: (Official answer)</p>
                  <p className="text-sm text-paper-dim">{q.answer}</p>
                </div>
              ) : (
                <p className="text-xs text-steel italic">Awaiting answer…</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
