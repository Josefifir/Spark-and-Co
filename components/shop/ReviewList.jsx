"use client";

import { Star, ShieldCheck } from "lucide-react";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-flame text-flame" : "text-paper-dim"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewList({ reviews, averageRating, reviewCount }) {
  if (!reviews || reviews.length === 0) {
    if (reviewCount === 0) {
      return (
        <div className="text-center py-8 text-paper-dim">
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-paper-dim">
        <p>Reviews are being moderated and will appear shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rating summary */}
      <div className="flex items-start gap-6 pb-6 border-b border-hairline">
        <div className="text-center">
          <div className="text-4xl font-bold text-paper mb-1">
            {averageRating ? averageRating.toFixed(1) : "—"}
          </div>
          {averageRating && (
            <>
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-xs text-paper-dim mt-2">{reviewCount} reviews</p>
            </>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {/* Optional: Add rating distribution breakdown here */}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review._id} className="pb-6 border-b border-hairline last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <StarRating rating={review.rating} />
                {review.title && (
                  <h4 className="font-display font-medium text-paper mt-2">
                    {review.title}
                  </h4>
                )}
              </div>
              <span className="text-xs text-paper-dim">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-paper-dim mb-3">{review.text}</p>

            <div className="flex items-center gap-3">
              <span className="font-mono-tech text-xs text-steel">{review.customerName}</span>
              {review.orderNumber && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <ShieldCheck className="w-3 h-3" /> Verified Purchase
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
