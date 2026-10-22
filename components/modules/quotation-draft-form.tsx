"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ModuleCard } from "./module-ui";

type Line = { description: string; quantity: string; price: string };
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const validity = new Date(`${today}T12:00:00Z`); validity.setUTCDate(validity.getUTCDate() + 15);
const defaultValidity = validity.toISOString().slice(0, 10);
const toPaisa = (value: string) => Math.round(Number(value || 0) * 100);
const money = (paisa: number) => `Rs ${(paisa / 100).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function QuotationDraftForm() {
  const [partyKind, setPartyKind] = useState<"Customer" | "Lead">("Customer");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: "1", price: "" }]);
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Math.round(Number(line.quantity || 0) * toPaisa(line.price)), 0), [lines]);
  const total = Math.max(0, subtotal - toPaisa(discount) + toPaisa(tax));
  const updateLine = (index: number, field: keyof Line, value: string) => setLines(current => current.map((line, i) => i === index ? { ...line, [field]: value } : line));
  return <div className="module-form-layout"><div className="module-form-main">
    <ModuleCard><h2>Party</h2><p className="module-muted">Choose who will receive this quotation.</p><div className="module-segment module-kind"><button type="button" className={partyKind === "Customer" ? "active" : ""} onClick={() => setPartyKind("Customer")}>Customer</button><button type="button" className={partyKind === "Lead" ? "active" : ""} onClick={() => setPartyKind("Lead")}>Lead</button></div><label className="module-field">{partyKind}<input placeholder={`Search ${partyKind.toLowerCase()}s`} disabled title="Available when the quotation API is connected" /></label><p className="module-hint">Party selection will be enabled when customer and lead endpoints are connected.</p></ModuleCard>
    <ModuleCard><h2>Dates</h2><div className="module-grid-two"><label className="module-field">Issue date<input type="date" defaultValue={today} /></label><label className="module-field">Valid until<input type="date" defaultValue={defaultValidity} min={today} /></label></div></ModuleCard>
    <ModuleCard><div className="module-card-title"><div><h2>Items</h2><p className="module-muted">Add products or write a custom description.</p></div><button type="button" className="module-secondary" onClick={() => setLines(current => [...current, { description: "", quantity: "1", price: "" }])}>+ Add item</button></div><div className="module-line-list">{lines.map((line, index) => <div className="module-line" key={index}><label className="module-field module-description">Description<input dir="auto" value={line.description} maxLength={500} onChange={event => updateLine(index, "description", event.target.value)} placeholder="Item or service description" /></label><label className="module-field">Quantity<input type="number" min="0.001" max="1000000" step="0.001" value={line.quantity} onChange={event => updateLine(index, "quantity", event.target.value)} /></label><label className="module-field">Unit price (Rs)<input type="number" min="0" step="0.01" value={line.price} onChange={event => updateLine(index, "price", event.target.value)} placeholder="0.00" /></label><div className="module-line-total"><span>Line total</span><strong>{money(Math.round(Number(line.quantity || 0) * toPaisa(line.price)))}</strong></div><button type="button" className="module-remove" aria-label={`Remove item ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines(current => current.filter((_, i) => i !== index))}>×</button></div>)}</div></ModuleCard>
    <ModuleCard><h2>Notes and terms</h2><div className="module-grid-two"><label className="module-field">Internal notes<textarea dir="auto" maxLength={1000} rows={4} placeholder="Add context for your team" /></label><label className="module-field">Terms for customer<textarea dir="auto" maxLength={2000} rows={4} placeholder="Payment and delivery terms" /></label></div></ModuleCard>
  </div><aside className="module-form-aside"><ModuleCard><h2>Estimated total</h2><p className="module-muted">Final amounts are calculated when saved.</p><div className="module-total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><label className="module-field">Discount (Rs)<input type="number" min="0" max={subtotal / 100} step="0.01" value={discount} onChange={event => setDiscount(event.target.value)} /></label>{toPaisa(discount) > subtotal && <p className="module-error">Discount cannot exceed subtotal.</p>}<label className="module-field">Tax (Rs)<input type="number" min="0" step="0.01" value={tax} onChange={event => setTax(event.target.value)} /></label><div className="module-total-row module-grand-total"><span>Total</span><strong>{money(total)}</strong></div></ModuleCard><div className="module-preview-note">UI preview: saving and sending will be available when the quotation API is connected.</div></aside><div className="module-form-footer"><Link href="/quotations" className="module-secondary">Cancel</Link><button disabled title="Quotation API is not connected">Save draft</button><button disabled title="Quotation API is not connected">Save and send</button></div></div>;
}
