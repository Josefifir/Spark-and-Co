"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function WishlistButton({ productId, className = "" }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customer/wishlist")
      .then((r) => r.ok ? r.json() : { wishlist: [] })
      .then((d) => setWishlisted(d.wishlist?.some((p) => p._id === productId)))
      .catch(() => {});
  }, [productId]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/customer/wishlist?productId=${productId}`, { method: "DELETE" });
        setWishlisted(false);
        toast("Removed from wishlist");
      } else {
        const res = await fetch("/api/customer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.status === 401) {
          toast.error("Sign in to save items to your wishlist");
          return;
        }
        setWishlisted(true);
        toast.success("Saved to wishlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-2 rounded-sm border border-hairline hover:border-steel transition-colors ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${wishlisted ? "fill-flame text-flame" : "text-steel"}`}
      />
    </button>
  );
}
