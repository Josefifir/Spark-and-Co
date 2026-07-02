"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AccountProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    preferredCurrency: "usd",
    preferredLocale: "en",
    marketingOptIn: false,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCustomer();
  }, []);

  async function fetchCustomer() {
    try {
      const res = await fetch("/api/customer/me");
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setFormData({
          firstName: data.customer.firstName || "",
          lastName: data.customer.lastName || "",
          phone: data.customer.phone || "",
          preferredCurrency: data.customer.preferredCurrency || "usd",
          preferredLocale: data.customer.preferredLocale || "en",
          marketingOptIn: data.customer.marketingOptIn || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setFormData({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      phone: customer.phone || "",
      preferredCurrency: customer.preferredCurrency || "usd",
      preferredLocale: customer.preferredLocale || "en",
      marketingOptIn: customer.marketingOptIn || false,
    });
    setMessage({ type: "", text: "" });
  }

  if (loading) {
    return (
      <div className="bg-panel rounded-lg border border-hairline p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-panel-raised rounded w-1/4"></div>
          <div className="h-4 bg-panel-raised rounded w-1/2"></div>
          <div className="h-4 bg-panel-raised rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-lg border border-hairline p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-paper">Profile Information</h2>
          {!editing && (
            <Button onClick={() => setEditing(true)} className="w-full sm:w-auto">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-success/10 text-success border border-success/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {!editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-paper-dim">Email</label>
            <p className="mt-1 text-paper">{customer.email}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-paper-dim">First Name</label>
              <p className="mt-1 text-paper">{customer.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Last Name</label>
              <p className="mt-1 text-paper">{customer.lastName}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-dim">Phone</label>
            <p className="mt-1 text-paper">{customer.phone || "Not provided"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-paper-dim">Preferred Currency</label>
              <p className="mt-1 text-paper">{customer.preferredCurrency?.toUpperCase()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Preferred Language</label>
              <p className="mt-1 text-paper">{customer.preferredLocale === "en" ? "English" : "Deutsch"}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-dim">Marketing Emails</label>
            <p className="mt-1 text-paper">{customer.marketingOptIn ? "Subscribed" : "Not subscribed"}</p>
          </div>
          <div className="pt-4 border-t border-hairline">
            <p className="text-sm text-steel">
              Member since: {new Date(customer.createdAt).toLocaleDateString()}
            </p>
            {customer.lastLoginAt && (
              <p className="text-sm text-steel">
                Last login: {new Date(customer.lastLoginAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-paper-dim">Email</label>
            <p className="mt-1 text-paper">{customer.email}</p>
            <p className="text-xs text-steel">Email cannot be changed</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-paper-dim">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-paper-dim">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-paper focus:border-flame focus:ring-flame"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-paper-dim">Preferred Currency</label>
              <select
                value={formData.preferredCurrency}
                onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Preferred Language</label>
              <select
                value={formData.preferredLocale}
                onChange={(e) => setFormData({ ...formData, preferredLocale: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-panel-raised px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="marketingOptIn"
              checked={formData.marketingOptIn}
              onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
              className="h-4 w-4 text-flame focus:ring-flame border-hairline rounded"
            />
            <label htmlFor="marketingOptIn" className="ml-2 block text-sm text-paper-dim">
              Subscribe to marketing emails
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Made with Bob