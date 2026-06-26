"use client";

import { csrfFetch } from "@/lib/auth/csrfFetch";

import { useEffect, useState, useCallback } from "react";
import { Check, X, Trash2, ChevronDown, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-flame" : "text-paper-dim"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewActionsModal({ review, onClose, onUpdated }) {
  const [action, setAction] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/admin/reviews/${review._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review approved!");
        onUpdated();
      } else {
        toast.error(data.error || "Failed to approve review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error approving review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/admin/reviews/${review._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", adminNote }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review rejected");
        onUpdated();
      } else {
        toast.error(data.error || "Failed to reject review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this review?")) return;
    setSubmitting(true);
    try {
      const res = await csrfFetch(`/api/admin/reviews/${review._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Review deleted");
        onUpdated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (action === "reject") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
        <div
          className="bg-panel border border-hairline rounded-sm w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-hairline">
            <h3 className="font-display font-bold text-paper">Reject review</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Admin note (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Why are you rejecting this review?"
                rows={3}
                maxLength={500}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Rejecting..." : "Reject review"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAction(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-hairline">
          <h3 className="font-display font-bold text-paper">Review details</h3>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-1">
              Product
            </p>
            <p className="text-paper font-medium">{review.product.name}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-1">
              Rating
            </p>
            <StarRating rating={review.rating} />
          </div>

          {review.title && (
            <div>
              <p className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-1">
                Title
              </p>
              <p className="text-paper">{review.title}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-1">
              Review
            </p>
            <p className="text-paper-dim text-sm">{review.text}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-1">
              Customer
            </p>
            <p className="text-paper">{review.customerName}</p>
            <p className="text-xs text-paper-dim">{review.customerEmail}</p>
          </div>

          <div className="pt-4 border-t border-hairline space-y-2">
            {review.status === "pending" && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="w-full"
                >
                  <Check className="w-4 h-4" /> Approve review
                </Button>
                <Button
                  onClick={() => setAction("reject")}
                  variant="secondary"
                  className="w-full"
                >
                  <X className="w-4 h-4" /> Reject review
                </Button>
              </>
            )}
            <Button
              onClick={handleDelete}
              disabled={submitting}
              variant="secondary"
              className="w-full text-danger"
            >
              <Trash2 className="w-4 h-4" /> Delete review
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkRejectModal({ onClose, onConfirm, count }) {
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm(adminNote);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-hairline">
          <h3 className="font-display font-bold text-paper">Reject {count} review{count !== 1 ? 's' : ''}</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-paper-dim text-sm">
            You are about to reject {count} review{count !== 1 ? 's' : ''}. This action can be reversed later.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
              Admin note (optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Why are you rejecting these reviews?"
              rows={3}
              maxLength={500}
              className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Rejecting..." : "Reject reviews"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState(new Set());
  const [selectedReview, setSelectedReview] = useState(null);
  const [showBulkReject, setShowBulkReject] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: "pending",
    rating: "",
    minRating: "",
    maxRating: "",
    dateFrom: "",
    dateTo: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    return params.toString();
  }, [filters, pagination.page, pagination.limit]);

  const load = useCallback(() => {
    setLoading(true);
    setSelectedReviews(new Set());
    
    fetch(`/api/admin/reviews?${buildQueryString()}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load reviews");
      })
      .finally(() => setLoading(false));
  }, [buildQueryString]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(reviews.map((r) => r._id)));
    }
  };

  const handleSelectReview = (reviewId) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const handleBulkAction = async (action, adminNote = "") => {
    if (selectedReviews.size === 0) return;

    if (action === "delete") {
      if (!confirm(`Permanently delete ${selectedReviews.size} review(s)?`)) return;
    }

    setBulkProcessing(true);
    try {
      const res = await csrfFetch("/api/admin/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: Array.from(selectedReviews),
          action,
          adminNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `Successfully processed ${data.success} review(s)`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} review(s) failed to process`);
        }
        load();
      } else {
        toast.error(data.error || "Failed to process bulk action");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error processing bulk action");
    } finally {
      setBulkProcessing(false);
      setShowBulkReject(false);
    }
  };

  const handleBulkApprove = () => handleBulkAction("approve");
  const handleBulkReject = (adminNote) => handleBulkAction("reject", adminNote);
  const handleBulkDelete = () => handleBulkAction("delete");

  const selectedCount = selectedReviews.size;
  const allSelected = reviews.length > 0 && selectedReviews.size === reviews.length;

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-2xl font-bold text-paper">Product reviews</h1>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Hide" : "Show"} Filters
        </Button>
      </div>
      <p className="text-sm text-paper-dim mb-8">
        Moderate customer reviews before they appear on product pages. All reviews must be approved to be displayed publicly.
      </p>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-panel border border-hairline rounded-sm p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange("rating", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Date From */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-dim" />
              <input
                type="search"
                placeholder="Search reviews by text or customer name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full bg-graphite border border-hairline rounded-sm pl-10 pr-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="createdAt">Date Created</option>
                <option value="rating">Rating</option>
                <option value="productName">Product Name</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({
                  status: "pending",
                  rating: "",
                  minRating: "",
                  maxRating: "",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                  sortBy: "createdAt",
                  sortOrder: "desc",
                });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <div className="bg-flame/10 border border-flame/30 rounded-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="text-paper font-mono-tech">
              {selectedCount} review{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                size="sm"
              >
                <Check className="w-4 h-4" /> Approve Selected
              </Button>
              <Button
                onClick={() => setShowBulkReject(true)}
                disabled={bulkProcessing}
                variant="secondary"
                size="sm"
              >
                <X className="w-4 h-4" /> Reject Selected
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                variant="secondary"
                size="sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Selected
              </Button>
              <Button
                onClick={() => setSelectedReviews(new Set())}
                variant="secondary"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <p className="text-paper-dim">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No reviews found matching your filters.
        </div>
      ) : (
        <>
          <div className="border border-hairline rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left bg-panel">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-hairline"
                      aria-label="Select all reviews"
                    />
                  </th>
                  <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Product</th>
                  <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Rating</th>
                  <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Review</th>
                  <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Customer</th>
                  <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-panel transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review._id)}
                        onChange={() => handleSelectReview(review._id)}
                        className="w-4 h-4 rounded border-hairline"
                        aria-label={`Select review from ${review.customerName}`}
                      />
                    </td>
                    <td className="p-4 text-paper font-medium text-sm">{review.product.name}</td>
                    <td className="p-4">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="p-4 text-paper-dim text-xs max-w-xs truncate">
                      {review.title || review.text.substring(0, 50)}...
                    </td>
                    <td className="p-4 text-paper-dim text-xs">{review.customerName}</td>
                    <td className="p-4 text-paper-dim text-xs">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-paper-dim hover:text-flame transition-colors p-1.5"
                        aria-label="View review details"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-paper-dim">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="px-4 py-2 text-paper font-mono-tech text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedReview && (
        <ReviewActionsModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onUpdated={() => {
            setSelectedReview(null);
            load();
          }}
        />
      )}

      {showBulkReject && (
        <BulkRejectModal
          count={selectedCount}
          onClose={() => setShowBulkReject(false)}
          onConfirm={handleBulkReject}
        />
      )}
    </div>
  );
}

// Made with Bob
