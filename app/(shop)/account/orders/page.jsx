"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  async function fetchOrders(page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/orders?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents, currency = "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  }

  // Design-system status badges using the project's colour tokens
  function PaymentBadge({ status }) {
    const map = {
      paid:      "bg-flame/10 text-flame border border-flame/30",
      pending:   "bg-steel/10 text-paper-dim border border-hairline",
      failed:    "bg-danger/10 text-danger border border-danger/30",
      refunded:  "bg-steel/10 text-paper-dim border border-hairline",
      expired:   "bg-steel/10 text-paper-dim border border-hairline",
      cancelled: "bg-danger/10 text-danger border border-danger/30",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${map[status] || "bg-steel/10 text-paper-dim border border-hairline"}`}>
        {status}
      </span>
    );
  }

  function FulfillmentBadge({ status }) {
    const map = {
      unfulfilled: "bg-steel/10 text-paper-dim border border-hairline",
      processing:  "bg-flame/5 text-flame border border-flame/20",
      shipped:     "bg-flame/10 text-flame border border-flame/30",
      delivered:   "bg-flame/20 text-flame border border-flame/40",
      cancelled:   "bg-danger/10 text-danger border border-danger/30",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono-tech uppercase tracking-wider ${map[status] || "bg-steel/10 text-paper-dim border border-hairline"}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-panel-raised rounded w-1/4" />
          <div className="h-20 bg-panel-raised rounded" />
          <div className="h-20 bg-panel-raised rounded" />
          <div className="h-20 bg-panel-raised rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-paper mb-6">Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-10 w-10 text-steel/40" />
          <h3 className="mt-4 text-sm font-medium text-paper">No orders yet</h3>
          <p className="mt-1 text-sm text-paper-dim">Start shopping to see your orders here.</p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center px-5 py-2.5 bg-flame text-graphite font-semibold rounded-sm hover:bg-flame-bright transition-colors text-sm"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-hairline rounded-sm p-3 sm:p-4 hover:border-steel transition-colors"
              >
                {/* Top row: order number + date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-3">
                  <div>
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="font-display font-semibold text-paper hover:text-flame transition-colors"
                    >
                      Order #{order.orderNumber}
                    </Link>
                    <p className="text-xs text-paper-dim mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PaymentBadge status={order.paymentStatus} />
                    <FulfillmentBadge status={order.fulfillmentStatus} />
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-paper-dim text-xs">Items</span>
                    <p className="text-paper font-mono-tech">{order.items.length}</p>
                  </div>
                  <div>
                    <span className="text-paper-dim text-xs">Total</span>
                    <p className="text-paper font-mono-tech">{formatPrice(order.totalCents, order.currency)}</p>
                  </div>
                  <div>
                    <span className="text-paper-dim text-xs">Payment</span>
                    <p className="text-paper capitalize text-xs mt-0.5">{order.paymentMethod}</p>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <span className="text-paper-dim text-xs">Tracking</span>
                      <p className="text-paper text-xs mt-0.5 font-mono-tech">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-hairline pt-3">
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="text-xs text-flame hover:text-flame-bright font-medium font-mono-tech"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-hairline rounded-sm text-sm text-paper-dim hover:border-steel hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-xs text-steel font-mono-tech">
                {currentPage} / {pagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border border-hairline rounded-sm text-sm text-paper-dim hover:border-steel hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Made with Bob
