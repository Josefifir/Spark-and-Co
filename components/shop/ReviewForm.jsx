"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";

export default function ReviewForm({ token, product }) {
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    text: "",
    customerName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState({ loading: true, valid: true, message: null });

  // Check token status on mount
  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch('/api/reviews/verify-token', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!data.valid) {
          // Token is invalid or already used
          setTokenStatus({ loading: false, valid: false, message: data.message });
          if (data.used) {
            setSuccess(true); // Show "already submitted" message
          }
        } else {
          setTokenStatus({ loading: false, valid: true, message: null });
        }
      } catch (err) {
        console.error("Token check error:", err);
        setTokenStatus({ loading: false, valid: true, message: null }); // Allow form on error
      }
    }

    checkToken();
  }, [token]);

  const update = (field) => (e) => {
    setForm((f) => ({
      ...f,
      [field]: e.target.value,
    }));
  };

  const updateRating = (rating) => {
    setForm((f) => ({ ...f, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating: form.rating,
          title: form.title,
          text: form.text,
          customerName: form.customerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      toast.success(data.message);
      setForm({ rating: 5, title: "", text: "", customerName: "" });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // Show loading state while checking token
  if (tokenStatus.loading) {
    return (
      <div className="bg-panel border border-hairline rounded-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-panel-raised rounded w-1/4"></div>
          <div className="h-10 bg-panel-raised rounded"></div>
          <div className="h-20 bg-panel-raised rounded"></div>
        </div>
      </div>
    );
  }

  // Show message if token is invalid or already used
  if (!tokenStatus.valid || success) {
    return (
      <div className="bg-success/5 border border-success/30 rounded-sm p-6 text-center">
        <h3 className="font-display font-bold text-success mb-2">Thanks for your review!</h3>
        <p className="text-sm text-paper-dim">
          Your review has been submitted and will appear on this page after our team approves it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-panel border border-hairline rounded-sm p-6 space-y-4">
      <h3 className="font-display font-bold text-paper">Share your experience</h3>

      <div>
        <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-3 block">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => updateRating(rating)}
              className="transition-colors"
              aria-label={`Rate ${rating} stars`}
            >
              <Star
                className={`w-6 h-6 ${
                  rating <= form.rating
                    ? "fill-flame text-flame"
                    : "text-paper-dim hover:text-flame"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title (optional)"
        placeholder="e.g., Great lighter!"
        value={form.title}
        onChange={update("title")}
        maxLength={100}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
          Your review *
        </label>
        <textarea
          value={form.text}
          onChange={update("text")}
          placeholder="What did you think of this product?"
          maxLength={5000}
          rows={4}
          required
          className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
        />
        <p className="text-xs text-paper-dim">
          {form.text.length}/5000 characters
        </p>
      </div>

      <Input
        label="Your name (optional)"
        placeholder="First name or nickname"
        value={form.customerName}
        onChange={update("customerName")}
        maxLength={100}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={submitting || !form.text.trim()} className="w-full">
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
