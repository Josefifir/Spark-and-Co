"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { calculateOrderVAT, isEUCountry } from "@/lib/utils-vat";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Lock, ShieldCheck, Bitcoin, CreditCard, Building2, Info, Truck, Package, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import StripePaymentForm from "@/components/shop/StripePaymentForm";
import CheckoutStepper from "@/components/shop/CheckoutStepper";
import PaymentRequestButton from "@/components/shop/PaymentRequestButton";
import { getData } from 'country-list';
import LoyaltyRedemption from "@/components/shop/LoyaltyRedemption";
import FreeShippingBar from "@/components/shop/FreeShippingBar";
import DutyEstimator from "@/components/shop/DutyEstimator";


const COUNTRIES = getData().map(({ code, name }) => ({
  code,
  name
}));

// Sticky mobile order summary
function MobileOrderSummary({ items, subtotalCents, appliedDiscount, loyaltyDiscount, selectedShipping, formatPrice }) {
  const [open, setOpen] = useState(false);
  const finalSubtotal = appliedDiscount ? subtotalCents - appliedDiscount.discountCents : subtotalCents;
  const total = Math.max(0, finalSubtotal - (loyaltyDiscount || 0) + (selectedShipping?.cost || 0));
  return (
    <div className="lg:hidden sticky bottom-0 z-30 bg-graphite border-t border-hairline">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
        aria-expanded={open}
      >
        <span className="text-paper-dim flex items-center gap-1.5">
          <Package className="w-4 h-4" /> Order summary
          <span className="text-steel ml-1">({items.length} item{items.length !== 1 ? "s" : ""})</span>
        </span>
        <span className="font-mono-tech text-flame font-bold">{formatPrice(total)}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-hairline pt-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <span className="text-paper-dim">{item.name} <span className="text-steel">× {item.quantity}</span></span>
              <span className="font-mono-tech text-paper">{formatPrice(item.priceCents * item.quantity)}</span>
            </div>
          ))}
          {appliedDiscount && (
            <div className="flex justify-between text-success text-xs">
              <span>Discount ({appliedDiscount.code})</span>
              <span className="font-mono-tech">-{formatPrice(appliedDiscount.discountCents)}</span>
            </div>
          )}
          {selectedShipping && (
            <div className="flex justify-between text-xs text-paper-dim">
              <span>Shipping</span>
              <span className="font-mono-tech">{selectedShipping.isFree ? <span className="text-flame">FREE</span> : formatPrice(selectedShipping.cost)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalCents, clearCart, hydrated } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { t, locale } = useLocale();

  // ── wizard step (0 = contact+address, 1 = shipping+discounts, 2 = review+pay) ──
  const [step, setStep] = useState(0);

  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("referral_code");
    if (stored) setReferralCode(stored);
  }, []);

  const [form, setForm] = useState({
    customerEmail: "",
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [errors, setErrors] = useState({});
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [vatBreakdown, setVatBreakdown] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const handleSelectAddress = useCallback((addressId, addresses) => {
    setSelectedAddressId(addressId);
    const list = addresses || savedAddresses;
    const address = list.find(a => a._id === addressId);
    if (address) {
      setForm(f => ({
        ...f,
        name: address.name,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state || "",
        postalCode: address.postalCode,
        country: address.country,
      }));
    }
  }, [savedAddresses]);

  useEffect(() => {
    async function fetchCustomerData() {
      try {
        const res = await fetch("/api/customer/me");
        if (res.ok) {
          const data = await res.json();
          setForm(f => ({ ...f, customerEmail: data.customer.email }));
          const addressRes = await fetch("/api/customer/addresses");
          if (addressRes.ok) {
            const addressData = await addressRes.json();
            setSavedAddresses(addressData.addresses);
            const defaultAddr = addressData.addresses.find(a => a.isDefault);
            if (defaultAddr) handleSelectAddress(defaultAddr._id, addressData.addresses);
          }
        }
      } catch {}
    }
    fetchCustomerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setSelectedAddressId(null);
    if (field === "country") calculateVAT(value);
  };

  const calculateVAT = (countryCode) => {
    if (!countryCode || !isEUCountry(countryCode)) { setVatBreakdown(null); return; }
    const finalSubtotal = appliedDiscount ? subtotalCents - appliedDiscount.discountCents : subtotalCents;
    setVatBreakdown(calculateOrderVAT(finalSubtotal, countryCode, true));
  };

  useEffect(() => {
    calculateVAT(form.country);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotalCents, appliedDiscount, form.country]);

  async function calculateShipping() {
    setLoadingShipping(true);
    try {
      const finalSubtotal = appliedDiscount ? subtotalCents - appliedDiscount.discountCents : subtotalCents;
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { country: form.country, state: form.state, postalCode: form.postalCode, city: form.city },
          orderDetails: {
            subtotalCents: finalSubtotal,
            weightGrams: items.reduce((sum, item) => sum + (item.weightGrams || 100) * item.quantity, 0),
            items,
          },
        }),
      });
      const data = await res.json();
      setShippingRates(data.rates || []);
      if (data.rates?.length > 0) setSelectedShipping(data.rates[0]);
      else setSelectedShipping(null);
    } catch {
      toast.error("Failed to calculate shipping rates");
      setShippingRates([]);
      setSelectedShipping(null);
    } finally {
      setLoadingShipping(false);
    }
  }

  useEffect(() => {
    if (form.country && form.city && form.postalCode) calculateShipping();
    else { setShippingRates([]); setSelectedShipping(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country, form.city, form.postalCode, form.state, subtotalCents, appliedDiscount]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) { setAppliedDiscount(null); return; }
    setValidatingDiscount(true);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotalCents, cartItems: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
      });
      const data = await res.json();
      if (data.valid) { setAppliedDiscount(data); toast.success(t('checkout.discountApplied', { amount: formatPrice(data.discountCents) })); }
      else { setAppliedDiscount(null); toast.error(data.error || t('checkout.invalidDiscount')); }
    } catch { setAppliedDiscount(null); toast.error(t('checkout.discountError')); }
    finally { setValidatingDiscount(false); }
  };

  // ── step validation ──
  const validateStep0 = () => {
    const next = {};
    if (!form.customerEmail.includes("@")) next.customerEmail = t('checkout.errors.validEmail');
    if (!form.name.trim()) next.name = t('checkout.errors.required');
    if (!form.line1.trim()) next.line1 = t('checkout.errors.required');
    if (!form.city.trim()) next.city = t('checkout.errors.required');
    if (!form.postalCode.trim()) next.postalCode = t('checkout.errors.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next = {};
    if (!ageConfirmed) next.age = t('checkout.errors.ageConfirmation');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateStep0()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => { setStep((s) => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            ...(i.personalisationText && { personalisationText: i.personalisationText }),
          })),
          customerEmail: form.customerEmail,
          shippingAddress: { name: form.name, line1: form.line1, line2: form.line2 || undefined, city: form.city, state: form.state || undefined, postalCode: form.postalCode, country: form.country },
          shippingMethod: selectedShipping ? { id: selectedShipping.id, name: selectedShipping.name, carrier: selectedShipping.carrier, carrierService: selectedShipping.carrierService, estimatedMinDays: selectedShipping.estimatedMinDays, estimatedMaxDays: selectedShipping.estimatedMaxDays, cost: selectedShipping.cost } : undefined,
          ageVerified: true,
          paymentMethod,
          discountCode: appliedDiscount?.code || undefined,
          referralCode: referralCode || undefined,
          loyaltyPointsToRedeem: loyaltyPointsToRedeem || undefined,
          currency,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || t('checkout.checkoutFailed')); setSubmitting(false); return; }

      setOrderNumber(data.orderNumber);
      if (data.paymentMethod === "stripe" || data.paymentMethod === "sepa" || data.paymentMethod === "revolut") {
        setStripeClientSecret(data.clientSecret);
        setSubmitting(false);
      } else if (data.paymentMethod === "bitcoin") {
        clearCart();
        window.location.href = data.hostedUrl;
      }
    } catch { toast.error(t('checkout.somethingWrong')); setSubmitting(false); }
  };

  if (!hydrated) return <div className="max-w-5xl mx-auto px-6 py-16" />;

  if (items.length === 0 && !stripeClientSecret) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-paper mb-3">{t('cart.empty')}</h1>
        <p className="text-paper-dim mb-8">{t('checkout.addBeforeCheckout')}</p>
        <Button onClick={() => router.push("/products")}>{t('cart.browseLighters')}</Button>
      </div>
    );
  }

  // ── Payment step (after checkout API call) ──
  if (stripeClientSecret && orderNumber) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-bold text-paper mb-2">
          {paymentMethod === "sepa" ? t('checkout.sepaDirectDebit') : paymentMethod === "revolut" ? t('checkout.revolutPay') : t('checkout.payment')}
        </h1>
        <p className="text-sm text-paper-dim mb-8">{t('checkout.orderNumber')} {orderNumber} — {t('checkout.completePayment')}</p>
        {paymentMethod === "sepa" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
            <p className="font-medium mb-2">💶 {t('checkout.sepaInfo.title')}</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t('checkout.sepaInfo.debit')}</li><li>{t('checkout.sepaInfo.refund')}</li><li>{t('checkout.sepaInfo.authorization')}</li>
            </ul>
          </div>
        )}
        {paymentMethod === "revolut" && (
          <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-md text-sm text-violet-900">
            <p className="font-medium mb-1">🔵 {t('checkout.revolutInfo.title')}</p>
            <p className="text-xs">{t('checkout.revolutInfo.description')}</p>
          </div>
        )}
        <StripePaymentForm clientSecret={stripeClientSecret} orderNumber={orderNumber} paymentMethod={paymentMethod} onSuccess={() => { clearCart(); router.push(`/checkout/success?order=${orderNumber}`); }} />
      </div>
    );
  }

  const finalSubtotal = appliedDiscount ? subtotalCents - appliedDiscount.discountCents : subtotalCents;
  const orderTotal = Math.max(0, finalSubtotal - loyaltyDiscount + (selectedShipping?.cost || 0));

  // ── Shared order summary sidebar ──
  const OrderSummary = (
    <div className="border border-hairline rounded-sm p-4 sm:p-5 lg:sticky lg:top-24">
      <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{t('checkout.orderSummary')}</h2>
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-paper-dim">{item.name} <span className="text-steel">× {item.quantity}</span></span>
            <span className="font-mono-tech text-paper">{formatPrice(item.priceCents * item.quantity, 'USD')}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline pt-4 space-y-2">
        <div className="flex justify-between"><span className="text-paper">{t('checkout.subtotal')}</span><span className="font-mono-tech text-paper">{formatPrice(subtotalCents)}</span></div>
        {appliedDiscount && (
          <div className="flex justify-between text-sm"><span className="text-green-600">{t('checkout.discount')} ({appliedDiscount.code})</span><span className="font-mono-tech text-green-600">-{formatPrice(appliedDiscount.discountCents)}</span></div>
        )}
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm"><span className="text-success">Loyalty points</span><span className="font-mono-tech text-success">-{formatPrice(loyaltyDiscount)}</span></div>
        )}
        {selectedShipping && (
          <div className="flex justify-between text-sm">
            <span className="text-paper-dim flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Shipping ({selectedShipping.name})</span>
            <span className="font-mono-tech text-paper">{selectedShipping.isFree ? <span className="text-flame font-medium">FREE</span> : formatPrice(selectedShipping.cost)}</span>
          </div>
        )}
        {vatBreakdown && (
          <>
            <div className="flex justify-between text-sm text-paper-dim"><span>{t('checkout.netAmount')}</span><span className="font-mono-tech">{formatPrice(vatBreakdown.netAmount)}</span></div>
            <div className="flex justify-between text-sm text-paper-dim"><span>{t('checkout.vat')} ({vatBreakdown.vatRate}%)</span><span className="font-mono-tech">{formatPrice(vatBreakdown.vatAmount)}</span></div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-sm">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">{t('checkout.vatIncluded', { country: form.country, rate: vatBreakdown.vatRate })}</p>
            </div>
          </>
        )}
      </div>
      <div className="border-t border-hairline pt-4 flex justify-between">
        <span className="text-paper font-medium">{t('checkout.total')}</span>
        <span className="font-mono-tech text-flame font-medium">{formatPrice(orderTotal)}</span>
      </div>
      <FreeShippingBar />
      <DutyEstimator country={form.country} totalCents={orderTotal} />
      <div className="mt-5 flex items-center gap-2 text-xs text-steel">
        <ShieldCheck className="w-3.5 h-3.5 text-flame" /> {t('checkout.secureCheckout')}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 pb-24 lg:pb-16">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-paper mb-6">{t('checkout.title')}</h1>
      <CheckoutStepper step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* ── Step 0: Contact + Address ── */}
        {step === 0 && (
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{t('checkout.contact')}</h2>
              <Input label={t('checkout.email')} type="email" value={form.customerEmail} onChange={update("customerEmail")} error={errors.customerEmail} placeholder="you@example.com" autoComplete="email" />
            </section>

            {savedAddresses.length > 0 && (
              <section>
                <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">Saved Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {savedAddresses.map((address) => (
                    <button key={address._id} type="button" onClick={() => handleSelectAddress(address._id)}
                      className={`text-left p-3 rounded-md border transition-colors ${selectedAddressId === address._id ? "border-flame bg-flame/5" : "border-hairline hover:border-steel"}`}>
                      <div className="flex items-start justify-between">
                        <div className="text-sm">
                          <p className="font-medium text-paper">{address.name}</p>
                          <p className="text-paper-dim text-xs mt-1">{address.line1}{address.line2 && `, ${address.line2}`}</p>
                          <p className="text-paper-dim text-xs">{address.city}, {address.state} {address.postalCode}</p>
                          <p className="text-paper-dim text-xs">{address.country}</p>
                        </div>
                        {address.isDefault && <span className="text-xs px-2 py-0.5 bg-flame/10 text-flame rounded">Default</span>}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-steel">Or enter a new address below</p>
              </section>
            )}

            <section>
              <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{t('checkout.shippingAddress')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Input label={t('checkout.fullName')} value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" /></div>
                <div className="sm:col-span-2"><Input label={t('checkout.addressLine1')} value={form.line1} onChange={update("line1")} error={errors.line1} autoComplete="address-line1" /></div>
                <div className="sm:col-span-2"><Input label={t('checkout.addressLine2')} value={form.line2} onChange={update("line2")} autoComplete="address-line2" /></div>
                <Input label={t('checkout.city')} value={form.city} onChange={update("city")} error={errors.city} autoComplete="address-level2" />
                <Input label={t('checkout.state')} value={form.state} onChange={update("state")} autoComplete="address-level1" />
                <Input label={t('checkout.postalCode')} value={form.postalCode} onChange={update("postalCode")} error={errors.postalCode} autoComplete="postal-code" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">{t('checkout.country')}</label>
                  <select value={form.country} onChange={update("country")} className="bg-panel border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors">
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button size="lg" onClick={goNext} className="flex items-center gap-2">
                Continue to Shipping <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: Shipping + Discounts ── */}
        {step === 1 && (
          <div className="lg:col-span-2 space-y-8">
            {shippingRates.length > 0 && (
              <section>
                <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4"><Truck className="w-4 h-4 inline mr-2" />Shipping Method</h2>
                {loadingShipping ? (
                  <div className="text-center py-8 text-paper-dim"><Package className="w-8 h-8 animate-pulse mx-auto mb-2" /><p className="text-sm">Calculating shipping rates...</p></div>
                ) : (
                  <div className="space-y-3">
                    {shippingRates.map((rate) => (
                      <button key={rate.id} type="button" onClick={() => setSelectedShipping(rate)}
                        className={`w-full text-left p-4 rounded-md border transition-colors ${selectedShipping?.id === rate.id ? "border-flame bg-flame/5" : "border-hairline hover:border-steel"}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-paper text-sm sm:text-base">{rate.name}</p>
                            {rate.description && <p className="text-xs sm:text-sm text-paper-dim mt-1">{rate.description}</p>}
                            {rate.estimatedMinDays && rate.estimatedMaxDays && (
                              <p className="text-xs text-steel mt-1.5 flex items-center gap-1"><Truck className="w-3 h-3" />{rate.estimatedMinDays === rate.estimatedMaxDays ? `${rate.estimatedMinDays} business day${rate.estimatedMinDays > 1 ? "s" : ""}` : `${rate.estimatedMinDays}-${rate.estimatedMaxDays} business days`}</p>
                            )}
                            {rate.carrier && <p className="text-xs text-steel mt-0.5">via {rate.carrier.toUpperCase()}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {rate.isFree ? <span className="text-flame font-medium text-sm sm:text-base">FREE</span> : <span className="font-mono-tech text-paper text-sm sm:text-base">{formatPrice(rate.cost)}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{t('checkout.promoCode')}</h2>
              <div className="flex gap-2">
                <Input label="" type="text" placeholder={t('checkout.enterPromoCode')} value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="flex-1" />
                <Button type="button" onClick={handleApplyDiscount} disabled={validatingDiscount || !discountCode.trim()} variant="secondary" className="self-end">
                  {validatingDiscount ? t('common.loading') : t('checkout.apply')}
                </Button>
              </div>
              {appliedDiscount && <p className="text-sm text-flame mt-2">✓ {appliedDiscount.discountType === "percentage" ? t('checkout.percentOff', { percent: appliedDiscount.discountValue }) : t('checkout.amountOff', { amount: formatPrice(appliedDiscount.discountValue) })}</p>}
            </section>

            <LoyaltyRedemption subtotalCents={subtotalCents} onRedeem={(pts) => { setLoyaltyPointsToRedeem(pts); setLoyaltyDiscount(pts); }} />

            <div className="flex justify-between">
              <Button variant="secondary" onClick={goBack} className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button size="lg" onClick={goNext} className="flex items-center gap-2">Continue to Payment <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review + Pay ── */}
        {step === 2 && (
          <div className="lg:col-span-2 space-y-8">
            {/* Address recap */}
            <section className="border border-hairline rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel">Delivering to</h2>
                <button onClick={() => setStep(0)} className="text-xs text-flame hover:text-flame-bright">Edit</button>
              </div>
              <p className="text-sm text-paper">{form.name}</p>
              <p className="text-xs text-paper-dim">{form.line1}{form.line2 ? `, ${form.line2}` : ""}, {form.city} {form.postalCode}, {form.country}</p>
              <p className="text-xs text-steel mt-1">{form.customerEmail}</p>
            </section>

            {/* PaymentRequest (Apple/Google Pay) — only appears if supported */}
            <PaymentRequestButton
              totalCents={orderTotal}
              currency={currency}
              onSuccess={async (ev) => {
                // For native payment flows, submit the order first then confirm the payment intent
                await handleSubmit(null);
                ev.complete("success");
              }}
            />

            <section>
              <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{t('checkout.paymentMethod')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "stripe", label: t('checkout.card'), icon: CreditCard },
                  { id: "sepa", label: "SEPA", icon: Building2 },
                  { id: "revolut", label: "Revolut", icon: CreditCard },
                  { id: "bitcoin", label: "Bitcoin", icon: Bitcoin },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-2 justify-center border rounded-sm py-3 text-sm transition-colors ${paymentMethod === id ? "border-flame bg-flame/5 text-flame" : "border-hairline text-paper-dim hover:border-steel"}`}>
                    <Icon className="w-4 h-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
              {paymentMethod === "sepa" && <p className="text-xs text-paper-dim mt-3">💶 {t('checkout.sepaDescription')}</p>}
              {paymentMethod === "revolut" && <p className="text-xs text-paper-dim mt-3">🔵 {t('checkout.revolutDescription')}</p>}
            </section>

            <section>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 accent-flame w-4 h-4" />
                <span className="text-sm text-paper-dim">{t('checkout.ageConfirmation')}</span>
              </label>
              {errors.age && <p className="text-xs text-danger mt-2">{errors.age}</p>}
            </section>

            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={goBack} className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button size="lg" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 min-w-[180px] justify-center">
                {submitting ? t('common.loading') : paymentMethod === "bitcoin" ? t('checkout.continueToBitcoin') : paymentMethod === "sepa" ? t('checkout.continueToSepa') : paymentMethod === "revolut" ? t('checkout.continueToRevolut') : t('checkout.continueToPayment')}
                {!submitting && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-steel">
              <Lock className="w-3.5 h-3.5" /> {t('checkout.securePayment')}
            </div>
          </div>
        )}

        {/* Sidebar order summary — desktop always visible, mobile only on step 2 */}
        <div className={`order-2 ${step < 2 ? "hidden lg:block" : "block"}`}>
          {OrderSummary}
        </div>
      </div>

      {/* Mobile sticky order summary footer */}
      <MobileOrderSummary
        items={items}
        subtotalCents={subtotalCents}
        appliedDiscount={appliedDiscount}
        loyaltyDiscount={loyaltyDiscount}
        selectedShipping={selectedShipping}
        formatPrice={formatPrice}
      />
    </div>
  );
}
