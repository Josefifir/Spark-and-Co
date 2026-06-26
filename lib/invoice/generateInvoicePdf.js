/**
 * Invoice PDF generator — legally compliant for Germany (§14 UStG).
 *
 * Required fields on a German invoice:
 *   1. Seller name + full address
 *   2. Buyer name + address
 *   3. Seller tax number (Steuernummer) or VAT-ID (USt-IdNr.)
 *   4. Consecutive, unique invoice number
 *   5. Invoice date
 *   6. Description, quantity, unit price, line total
 *   7. Net amount, VAT rate, VAT amount, gross total
 *   8. Payment due date / terms
 *   9. Buyer's VAT-ID if B2B (Reverse Charge)
 *
 * Uses @react-pdf/renderer — fully server-side, no browser needed.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import Counter from "@/lib/models/Counter";
import Order   from "@/lib/models/Order";

// ── Seller info from env ──────────────────────────────────────────────────────
const SELLER = {
  name:        process.env.INVOICE_SELLER_NAME        || "Spark & Co.",
  line1:       process.env.INVOICE_SELLER_ADDRESS1    || "Musterstraße 1",
  line2:       process.env.INVOICE_SELLER_ADDRESS2    || "",
  city:        process.env.INVOICE_SELLER_CITY        || "10115 Berlin",
  country:     process.env.INVOICE_SELLER_COUNTRY     || "Germany",
  email:       process.env.INVOICE_SELLER_EMAIL       || process.env.FROM_EMAIL || "",
  taxNumber:   process.env.INVOICE_SELLER_TAX_NUMBER  || "",   // Steuernummer
  vatId:       process.env.INVOICE_SELLER_VAT_ID      || "",   // USt-IdNr.
  bankName:    process.env.INVOICE_BANK_NAME          || "",
  iban:        process.env.INVOICE_IBAN               || "",
  bic:         process.env.INVOICE_BIC                || "",
  paymentDays: parseInt(process.env.INVOICE_PAYMENT_DAYS || "14", 10),
};

// German VAT rates — 19 % standard, 0 % for intra-EU B2B (Reverse Charge)
const DE_VAT_RATE = 0.19;

function isEU(countryCode) {
  const EU = ["AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR",
               "GR","HR","HU","IE","IT","LT","LU","LV","MT","NL","PL",
               "PT","RO","SE","SI","SK"];
  return EU.includes((countryCode || "").toUpperCase());
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  black:  "#1a1a1a",
  dim:    "#555555",
  light:  "#888888",
  border: "#dddddd",
  bg:     "#f7f7f7",
  accent: "#c0392b",  // a neutral dark-red — professional invoice look
};

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 9, color: C.black,
                  paddingTop: 48, paddingBottom: 60, paddingHorizontal: 52 },
  row:          { flexDirection: "row" },
  flex1:        { flex: 1 },
  mb4:          { marginBottom: 4 },
  mb8:          { marginBottom: 8 },
  mb16:         { marginBottom: 16 },
  mb24:         { marginBottom: 24 },

  // Header
  headerSeller: { fontSize: 8, color: C.dim, marginBottom: 24 },
  invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 4 },
  invoiceMeta:  { fontSize: 8.5, color: C.dim, lineHeight: 1.5 },

  // Addresses
  addressLabel: { fontSize: 7.5, color: C.light, textTransform: "uppercase",
                  letterSpacing: 0.8, marginBottom: 3 },
  addressText:  { fontSize: 9, lineHeight: 1.5 },
  bold:         { fontFamily: "Helvetica-Bold" },

  // Table
  tableHeader:  { flexDirection: "row", backgroundColor: C.bg,
                  borderTop: `1 solid ${C.border}`, borderBottom: `1 solid ${C.border}`,
                  paddingVertical: 5, paddingHorizontal: 6 },
  tableRow:     { flexDirection: "row", borderBottom: `1 solid ${C.border}`,
                  paddingVertical: 5, paddingHorizontal: 6 },
  colDesc:      { flex: 4 },
  colQty:       { flex: 1, textAlign: "right" },
  colUnit:      { flex: 1.5, textAlign: "right" },
  colTotal:     { flex: 1.5, textAlign: "right" },
  th:           { fontFamily: "Helvetica-Bold", fontSize: 8, color: C.dim,
                  textTransform: "uppercase", letterSpacing: 0.5 },

  // Totals
  totalsRow:    { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  totalsLabel:  { width: 120, textAlign: "right", color: C.dim, paddingRight: 12 },
  totalsValue:  { width: 90, textAlign: "right" },
  totalsDivider:{ borderTop: `1 solid ${C.border}`, marginTop: 6, paddingTop: 6 },
  grandLabel:   { fontFamily: "Helvetica-Bold", fontSize: 10 },
  grandValue:   { fontFamily: "Helvetica-Bold", fontSize: 10 },

  // Footer
  footer:       { position: "absolute", bottom: 32, left: 52, right: 52,
                  borderTop: `1 solid ${C.border}`, paddingTop: 8,
                  flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 7.5, color: C.light },

  // Notes
  note:         { fontSize: 8, color: C.dim, lineHeight: 1.6 },
  noteBox:      { backgroundColor: C.bg, padding: 10, borderRadius: 2, marginTop: 16 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(cents, currency = "EUR") {
  const sym = currency.toUpperCase() === "EUR" ? "€" : "$";
  return `${sym}${(cents / 100).toFixed(2)}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Invoice Document ─────────────────────────────────────────────────────────
function InvoiceDocument({ order, invoiceNumber, invoiceDate }) {
  const currency  = (order.currency || "usd").toUpperCase();
  const billing   = order.billingAddress?.line1 ? order.billingAddress : order.shippingAddress;
  const isB2B     = Boolean(order.billingAddress?.vatNumber);
  const buyerInEU = isEU(billing.country);

  // VAT logic: B2B intra-EU → Reverse Charge (0 %), otherwise 19 % if selling from DE
  const vatRate   = (isB2B && buyerInEU && billing.country !== "DE") ? 0 : DE_VAT_RATE;
  const reverseCharge = vatRate === 0 && isB2B;

  // Prices already include VAT (gross) — back-calculate net
  const grossTotal = order.totalCents;
  const netTotal   = Math.round(grossTotal / (1 + vatRate));
  const vatTotal   = grossTotal - netTotal;

  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + SELLER.paymentDays);

  return (
    <Document title={`Invoice ${invoiceNumber}`} author={SELLER.name}>
      <Page size="A4" style={s.page}>

        {/* ── Seller header line ── */}
        <Text style={s.headerSeller}>
          {SELLER.name} · {SELLER.line1}{SELLER.line2 ? `, ${SELLER.line2}` : ""} · {SELLER.city} · {SELLER.country}
        </Text>

        {/* ── Title + meta ── */}
        <View style={[s.row, s.mb24]}>
          <View style={s.flex1}>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <View style={[s.row, s.mb4]}>
              <Text style={[s.invoiceMeta, { width: 100 }]}>Invoice No.</Text>
              <Text style={[s.invoiceMeta, s.bold]}>{invoiceNumber}</Text>
            </View>
            <View style={[s.row, s.mb4]}>
              <Text style={[s.invoiceMeta, { width: 100 }]}>Invoice Date</Text>
              <Text style={s.invoiceMeta}>{fmtDate(invoiceDate)}</Text>
            </View>
            <View style={[s.row, s.mb4]}>
              <Text style={[s.invoiceMeta, { width: 100 }]}>Order No.</Text>
              <Text style={s.invoiceMeta}>{order.orderNumber}</Text>
            </View>
            <View style={[s.row, s.mb4]}>
              <Text style={[s.invoiceMeta, { width: 100 }]}>Due Date</Text>
              <Text style={s.invoiceMeta}>{fmtDate(dueDate)}</Text>
            </View>
          </View>

          {/* ── Billing address ── */}
          <View style={{ width: 180 }}>
            <Text style={s.addressLabel}>Bill To</Text>
            {billing.company && <Text style={[s.addressText, s.bold]}>{billing.company}</Text>}
            <Text style={[s.addressText, !billing.company && s.bold]}>{billing.name}</Text>
            {billing.vatNumber && (
              <Text style={s.addressText}>VAT-ID: {billing.vatNumber}</Text>
            )}
            <Text style={s.addressText}>{billing.line1}</Text>
            {billing.line2 && <Text style={s.addressText}>{billing.line2}</Text>}
            <Text style={s.addressText}>
              {billing.postalCode} {billing.city}
              {billing.state ? `, ${billing.state}` : ""}
            </Text>
            <Text style={s.addressText}>{billing.country}</Text>
          </View>
        </View>

        {/* ── Line items table ── */}
        <View style={s.tableHeader}>
          <Text style={[s.th, s.colDesc]}>Description</Text>
          <Text style={[s.th, s.colQty]}>Qty</Text>
          <Text style={[s.th, s.colUnit]}>Unit Price</Text>
          <Text style={[s.th, s.colTotal]}>Amount</Text>
        </View>

        {order.items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.colDesc]}>{item.name}</Text>
            <Text style={[s.colQty]}>{item.quantity}</Text>
            <Text style={[s.colUnit]}>{fmt(item.priceCents, currency)}</Text>
            <Text style={[s.colTotal]}>{fmt(item.priceCents * item.quantity, currency)}</Text>
          </View>
        ))}

        {/* ── Discount row ── */}
        {order.discountAppliedCents > 0 && (
          <View style={s.tableRow}>
            <Text style={[s.colDesc, { color: C.dim }]}>
              Discount{order.discountCodeUsed ? ` (${order.discountCodeUsed})` : ""}
            </Text>
            <Text style={s.colQty} />
            <Text style={s.colUnit} />
            <Text style={[s.colTotal, { color: C.dim }]}>
              -{fmt(order.discountAppliedCents, currency)}
            </Text>
          </View>
        )}

        {/* ── Shipping row ── */}
        {order.shippingCents > 0 && (
          <View style={s.tableRow}>
            <Text style={[s.colDesc, { color: C.dim }]}>
              Shipping{order.shippingMethod?.name ? ` — ${order.shippingMethod.name}` : ""}
            </Text>
            <Text style={s.colQty} />
            <Text style={s.colUnit} />
            <Text style={[s.colTotal, { color: C.dim }]}>{fmt(order.shippingCents, currency)}</Text>
          </View>
        )}

        {/* ── Totals ── */}
        <View style={{ marginTop: 12 }}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Net amount</Text>
            <Text style={s.totalsValue}>{fmt(netTotal, currency)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>
              {reverseCharge ? "VAT (0 % — Reverse Charge)" : `VAT (${Math.round(vatRate * 100)} %)`}
            </Text>
            <Text style={s.totalsValue}>{fmt(vatTotal, currency)}</Text>
          </View>
          <View style={[s.totalsRow, s.totalsDivider]}>
            <Text style={[s.totalsLabel, s.grandLabel]}>Total</Text>
            <Text style={[s.totalsValue, s.grandValue]}>{fmt(grossTotal, currency)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        <View style={s.noteBox}>
          {reverseCharge && (
            <Text style={[s.note, s.mb8]}>
              Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).
              The tax liability transfers to the recipient of the service pursuant to §13b UStG.
            </Text>
          )}
          {SELLER.iban && (
            <Text style={s.note}>
              Payment: {SELLER.bankName ? `${SELLER.bankName} · ` : ""}IBAN {SELLER.iban}{SELLER.bic ? ` · BIC ${SELLER.bic}` : ""}
            </Text>
          )}
          <Text style={[s.note, s.mb4]}>
            Please reference invoice number {invoiceNumber} in your payment.
          </Text>
          {SELLER.taxNumber && (
            <Text style={s.note}>Tax No.: {SELLER.taxNumber}</Text>
          )}
          {SELLER.vatId && (
            <Text style={s.note}>VAT-ID: {SELLER.vatId}</Text>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{SELLER.name}</Text>
          {SELLER.email && <Text style={s.footerText}>{SELLER.email}</Text>}
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Assign an invoice number to an order (idempotent) and return it.
 * Uses findOneAndUpdate with $inc for atomic sequential numbering.
 */
export async function assignInvoiceNumber(order) {
  if (order.invoiceNumber) return order.invoiceNumber;

  const year    = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `invoice-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const invoiceNumber = `INV-${year}-${String(counter.seq).padStart(5, "0")}`;

  await Order.updateOne(
    { _id: order._id },
    { invoiceNumber, invoiceDate: new Date() }
  );

  return invoiceNumber;
}

/**
 * Generate a PDF buffer for the given order.
 * Assigns an invoice number if one doesn't exist yet.
 *
 * @param {Object} order  - Mongoose order document (plain or lean)
 * @returns {Promise<Buffer>} PDF bytes
 */
export async function generateInvoicePdf(order) {
  const invoiceNumber = order.invoiceNumber || await assignInvoiceNumber(order);
  const invoiceDate   = order.invoiceDate   || new Date();

  const doc    = <InvoiceDocument order={order} invoiceNumber={invoiceNumber} invoiceDate={invoiceDate} />;
  const buffer = await renderToBuffer(doc);
  return buffer;
}
