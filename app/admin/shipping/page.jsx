"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Truck, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/auth/csrfFetch";

export default function AdminShippingPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    try {
      const res = await fetch("/api/admin/shipping-zones");
      const data = await res.json();
      setZones(data.zones || []);
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      toast.error("Failed to load shipping zones");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(zoneId) {
    if (!confirm("Are you sure you want to delete this shipping zone?")) return;

    try {
      const res = await csrfFetch(`/api/admin/shipping-zones/${zoneId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Shipping zone deleted");
        fetchZones();
      } else {
        toast.error("Failed to delete shipping zone");
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
      toast.error("Failed to delete shipping zone");
    }
  }

  function handleEdit(zone) {
    setEditingZone(zone);
    setShowModal(true);
  }

  function handleAdd() {
    setEditingZone(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingZone(null);
  }

  async function handleSave(zoneData) {
    try {
      const url = editingZone
        ? `/api/admin/shipping-zones/${editingZone._id}`
        : "/api/admin/shipping-zones";
      
      const method = editingZone ? "PATCH" : "POST";

      const res = await csrfFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zoneData),
      });

      if (res.ok) {
        toast.success(editingZone ? "Zone updated" : "Zone created");
        closeModal();
        fetchZones();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save zone");
      }
    } catch (error) {
      console.error("Failed to save zone:", error);
      toast.error("Failed to save zone");
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Package className="w-8 h-8 animate-pulse text-paper-dim" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paper">Shipping Zones</h1>
          <p className="text-sm text-paper-dim mt-1">
            Manage shipping rates and delivery zones
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <div className="border border-hairline rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-paper-dim mx-auto mb-4" />
          <h3 className="text-lg font-medium text-paper mb-2">No shipping zones</h3>
          <p className="text-sm text-paper-dim mb-6">
            Create your first shipping zone to start offering delivery options
          </p>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shipping Zone
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div
              key={zone._id}
              className="bg-panel border border-hairline rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-paper">
                      {zone.name}
                    </h3>
                    {!zone.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-steel/20 text-steel rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  {zone.description && (
                    <p className="text-sm text-paper-dim mb-2">{zone.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-steel">
                    <span>🌍 {zone.countries.length} countries</span>
                    <span>📦 {zone.rates.length} rate{zone.rates.length !== 1 ? 's' : ''}</span>
                    <span>Priority: {zone.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(zone)}
                    className="p-2 text-paper-dim hover:text-paper transition-colors"
                    title="Edit zone"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone._id)}
                    className="p-2 text-danger hover:text-red-400 transition-colors"
                    title="Delete zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-paper-dim mb-2">
                  Shipping Rates:
                </h4>
                {zone.rates.length === 0 ? (
                  <p className="text-sm text-steel italic">No rates configured</p>
                ) : (
                  zone.rates.map((rate, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-panel-raised rounded border border-hairline"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-paper">{rate.name}</p>
                          {!rate.enabled && (
                            <span className="text-xs px-1.5 py-0.5 bg-steel/20 text-steel rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        {rate.description && (
                          <p className="text-xs text-paper-dim mt-0.5">
                            {rate.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-steel">
                          {rate.carrier && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {rate.carrier.toUpperCase()}
                            </span>
                          )}
                          {rate.estimatedMinDays && rate.estimatedMaxDays && (
                            <span>
                              {rate.estimatedMinDays === rate.estimatedMaxDays
                                ? `${rate.estimatedMinDays} day${rate.estimatedMinDays > 1 ? 's' : ''}`
                                : `${rate.estimatedMinDays}-${rate.estimatedMaxDays} days`}
                            </span>
                          )}
                          <span className="capitalize">Type: {rate.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {rate.type === "free" ? (
                          <div>
                            <span className="text-flame font-medium">FREE</span>
                            {rate.freeShippingThreshold && (
                              <p className="text-xs text-steel mt-0.5">
                                over ${(rate.freeShippingThreshold / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                        ) : rate.type === "flat_rate" ? (
                          <span className="font-mono-tech text-paper">
                            ${(rate.flatRate / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-steel capitalize">
                            {rate.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {zone.countries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-hairline">
                  <p className="text-xs text-steel mb-2">Countries:</p>
                  <div className="flex flex-wrap gap-1">
                    {zone.countries.slice(0, 10).map((country) => (
                      <span
                        key={country}
                        className="text-xs px-2 py-1 bg-panel-raised border border-hairline rounded text-paper-dim"
                      >
                        {country}
                      </span>
                    ))}
                    {zone.countries.length > 10 && (
                      <span className="text-xs px-2 py-1 text-steel">
                        +{zone.countries.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ShippingZoneModal
          zone={editingZone}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function ShippingZoneModal({ zone, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: zone?.name || "",
    description: zone?.description || "",
    countries: zone?.countries?.join(", ") || "",
    enabled: zone?.enabled ?? true,
    priority: zone?.priority || 0,
    rates: zone?.rates || [],
  });

  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRateIndex, setEditingRateIndex] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    
    const data = {
      ...formData,
      countries: formData.countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
    };

    onSave(data);
  }

  function handleAddRate(rateData) {
    if (editingRateIndex !== null) {
      const newRates = [...formData.rates];
      newRates[editingRateIndex] = rateData;
      setFormData({ ...formData, rates: newRates });
    } else {
      setFormData({ ...formData, rates: [...formData.rates, rateData] });
    }
    setShowRateForm(false);
    setEditingRateIndex(null);
  }

  function handleEditRate(index) {
    setEditingRateIndex(index);
    setShowRateForm(true);
  }

  function handleDeleteRate(index) {
    const newRates = formData.rates.filter((_, i) => i !== index);
    setFormData({ ...formData, rates: newRates });
  }

  return (
    <div className="fixed inset-0 bg-graphite/80 flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-hairline rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-panel border-b border-hairline p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-paper">
            {zone ? "Edit Shipping Zone" : "Create Shipping Zone"}
          </h2>
          <button
            onClick={onClose}
            className="text-paper-dim hover:text-paper transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-paper mb-2">
              Zone Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper"
              placeholder="e.g., Germany, EU Countries, United States"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-2">
              Countries (ISO codes, comma-separated) *
            </label>
            <input
              type="text"
              value={formData.countries}
              onChange={(e) =>
                setFormData({ ...formData, countries: e.target.value })
              }
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper font-mono text-sm"
              placeholder="DE, AT, CH"
              required
            />
            <p className="text-xs text-steel mt-1">
              Use 2-letter ISO country codes (e.g., US, GB, DE)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-paper mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper"
                placeholder="0"
              />
              <p className="text-xs text-steel mt-1">Higher = checked first</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-8">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-flame"
                />
                <span className="text-sm text-paper">Enabled</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-paper">
                Shipping Rates
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditingRateIndex(null);
                  setShowRateForm(true);
                }}
                className="text-sm text-flame hover:text-flame-bright"
              >
                + Add Rate
              </button>
            </div>

            {formData.rates.length === 0 ? (
              <div className="border border-dashed border-hairline rounded p-4 text-center">
                <AlertCircle className="w-6 h-6 text-steel mx-auto mb-2" />
                <p className="text-sm text-steel">No rates added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.rates.map((rate, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-panel-raised border border-hairline rounded"
                  >
                    <div>
                      <p className="text-sm font-medium text-paper">{rate.name}</p>
                      <p className="text-xs text-steel capitalize">
                        {rate.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditRate(index)}
                        className="text-paper-dim hover:text-paper"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRate(index)}
                        className="text-danger hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-hairline">
            <Button type="submit" className="flex-1">
              {zone ? "Update Zone" : "Create Zone"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {showRateForm && (
          <RateFormModal
            rate={editingRateIndex !== null ? formData.rates[editingRateIndex] : null}
            onSave={handleAddRate}
            onClose={() => {
              setShowRateForm(false);
              setEditingRateIndex(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function RateFormModal({ rate, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: rate?.name || "",
    description: rate?.description || "",
    type: rate?.type || "flat_rate",
    flatRate: rate?.flatRate ? rate.flatRate / 100 : "",
    freeShippingThreshold: rate?.freeShippingThreshold
      ? rate.freeShippingThreshold / 100
      : "",
    estimatedMinDays: rate?.estimatedMinDays || "",
    estimatedMaxDays: rate?.estimatedMaxDays || "",
    carrier: rate?.carrier || "",
    carrierService: rate?.carrierService || "",
    enabled: rate?.enabled ?? true,
    priority: rate?.priority || 0,
  });

  function handleSubmit(e) {
    e.preventDefault();

    const data = {
      ...formData,
      flatRate: formData.flatRate ? Math.round(parseFloat(formData.flatRate) * 100) : undefined,
      freeShippingThreshold: formData.freeShippingThreshold
        ? Math.round(parseFloat(formData.freeShippingThreshold) * 100)
        : undefined,
      estimatedMinDays: formData.estimatedMinDays ? parseInt(formData.estimatedMinDays) : undefined,
      estimatedMaxDays: formData.estimatedMaxDays ? parseInt(formData.estimatedMaxDays) : undefined,
      priority: parseInt(formData.priority) || 0,
    };

    onSave(data);
  }

  return (
    <div className="fixed inset-0 bg-graphite/90 flex items-center justify-center z-[60] p-4">
      <div className="bg-panel border border-hairline rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-panel border-b border-hairline p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-paper">
            {rate ? "Edit Rate" : "Add Rate"}
          </h3>
          <button
            onClick={onClose}
            className="text-paper-dim hover:text-paper transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-paper mb-1">
              Rate Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
              placeholder="e.g., Standard Shipping, Express"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-1">
              Rate Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
              required
            >
              <option value="flat_rate">Flat Rate</option>
              <option value="free">Free Shipping</option>
              <option value="weight_based">Weight Based</option>
              <option value="price_based">Price Based</option>
            </select>
          </div>

          {formData.type === "flat_rate" && (
            <div>
              <label className="block text-sm font-medium text-paper mb-1">
                Flat Rate (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.flatRate}
                onChange={(e) =>
                  setFormData({ ...formData, flatRate: e.target.value })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
                placeholder="4.99"
                required
              />
            </div>
          )}

          {formData.type === "free" && (
            <div>
              <label className="block text-sm font-medium text-paper mb-1">
                Minimum Order Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.freeShippingThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, freeShippingThreshold: e.target.value })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
                placeholder="50.00"
              />
              <p className="text-xs text-steel mt-1">
                Leave empty for always free
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-paper mb-1">
                Min Days
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedMinDays}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedMinDays: e.target.value })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-paper mb-1">
                Max Days
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedMaxDays}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedMaxDays: e.target.value })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
                placeholder="3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-1">
              Carrier
            </label>
            <select
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
            >
              <option value="">Select carrier</option>
              <option value="dhl">DHL</option>
              <option value="dpd">DPD</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="usps">USPS</option>
              <option value="royal_mail">Royal Mail</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-paper mb-1">
              Carrier Service
            </label>
            <input
              type="text"
              value={formData.carrierService}
              onChange={(e) =>
                setFormData({ ...formData, carrierService: e.target.value })
              }
              className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
              placeholder="e.g., DHL Express, USPS Priority"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-paper mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full bg-panel-raised border border-hairline rounded px-3 py-2 text-paper text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-flame"
                />
                <span className="text-sm text-paper">Enabled</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-hairline">
            <Button type="submit" className="flex-1" size="sm">
              {rate ? "Update" : "Add"} Rate
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} size="sm">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob