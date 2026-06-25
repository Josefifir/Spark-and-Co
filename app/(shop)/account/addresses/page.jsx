"use client";

import { useEffect, useState } from "react";
import { getData } from "country-list";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Load countries from country-list
    const countryData = getData();
    setCountries(countryData);
    
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/customer/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
    setMessage({ type: "", text: "" });
  }

  function handleEdit(address) {
    setFormData({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state || "",
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingId(address._id);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const url = editingId
        ? `/api/customer/addresses/${editingId}`
        : "/api/customer/addresses";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAddresses();
        resetForm();
        setMessage({
          type: "success",
          text: editingId ? "Address updated successfully!" : "Address added successfully!",
        });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save address" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save address" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchAddresses();
        setMessage({ type: "success", text: "Address deleted successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete address" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete address" });
    }
  }

  async function handleSetDefault(id) {
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        await fetchAddresses();
        setMessage({ type: "success", text: "Default address updated!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update default address" });
    }
  }

  if (loading) {
    return (
      <div className="bg-panel rounded-lg border border-hairline p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-panel-raised rounded w-1/4"></div>
          <div className="h-20 bg-panel-raised rounded"></div>
          <div className="h-20 bg-panel-raised rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel rounded-sm border border-hairline p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-paper">Saved Addresses</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-flame text-graphite font-semibold rounded-sm hover:bg-flame-bright transition-colors text-sm"
          >
            Add New Address
          </button>
        )}
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-sm text-sm ${
            message.type === "success"
              ? "bg-flame/10 text-flame border border-flame/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 sm:p-6 bg-panel-raised rounded-sm border border-hairline">
          <h3 className="font-display text-base sm:text-lg font-semibold text-paper mb-4">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-paper-dim">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Address Line 1 *</label>
              <input
                type="text"
                required
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paper-dim">Address Line 2</label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-paper-dim">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-dim">State/Province</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-paper-dim">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-paper-dim">Country *</label>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-hairline bg-graphite px-3 py-2 text-paper focus:border-flame focus:ring-flame"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-flame focus:ring-flame border-hairline rounded bg-graphite"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-paper-dim">
                Set as default address
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-flame text-graphite font-medium rounded-md hover:bg-flame-bright transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-6 py-2 bg-panel-raised text-paper-dim rounded-md hover:bg-steel/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-steel"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-paper">No saved addresses</h3>
          <p className="mt-1 text-sm text-paper-dim">Add an address for faster checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`border rounded-sm p-4 ${
                address.isDefault ? "border-flame bg-flame/5" : "border-hairline bg-panel-raised"
              }`}
            >
              {address.isDefault && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-wider text-flame bg-flame/10 border border-flame/30 rounded-sm mb-2">
                  Default
                </span>
              )}
              <div className="text-sm space-y-0.5">
                <p className="font-medium text-paper">{address.name}</p>
                <p className="text-paper-dim text-xs">{address.line1}</p>
                {address.line2 && <p className="text-paper-dim text-xs">{address.line2}</p>}
                <p className="text-paper-dim text-xs">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-paper-dim text-xs">{address.country}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => handleEdit(address)}
                  className="text-xs text-flame hover:text-flame-bright font-medium font-mono-tech"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-xs text-paper-dim hover:text-paper font-medium font-mono-tech"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address._id)}
                  className="text-xs text-danger hover:text-danger/80 font-medium font-mono-tech"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Made with Bob