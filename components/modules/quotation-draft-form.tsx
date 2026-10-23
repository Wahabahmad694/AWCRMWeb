"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveQuotation } from "@/app/actions/new-modules";
import { formatPkr, karachiToday, pkrToPaisa } from "@/lib/crm-format";
import { ModuleCard } from "./module-ui";

type Party = { id: string; name: string };
type Product = { id: string; name: string; price_paisa: number };
export type QuotationInitial = { id: string; version: number; partyKind: "customer" | "lead"; partyId: string; issueDate: string; validUntil: string; lines: { product_id?: string; description: string; quantity: string; price: string }[]; discount: string; tax: string; notes: string; terms: string };
type Line = { product_id?: string; description: string; quantity: string; price: string };
const initialLine: Line = { description: "", quantity: "1", price: "" };
const today = karachiToday();
const expiry = new Date(`${today}T12:00:00Z`); expiry.setUTCDate(expiry.getUTCDate() + 15);

export function QuotationDraftForm({ customers = [], leads = [], products = [], defaultPartyKind = "customer", defaultPartyId = "", initial }: { customers?: Party[]; leads?: Party[]; products?: Product[]; defaultPartyKind?: "customer" | "lead"; defaultPartyId?: string; initial?: QuotationInitial }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveQuotation, {});
  const [partyKind, setPartyKind] = useState<"customer" | "lead">(initial?.partyKind ?? defaultPartyKind);
  const [partyId, setPartyId] = useState(initial?.partyId ?? defaultPartyId);
  const [lines, setLines] = useState<Line[]>(initial?.lines.length ? initial.lines : [{ ...initialLine }]);
  const [discount, setDiscount] = useState(initial?.discount ?? "0");
  const [tax, setTax] = useState(initial?.tax ?? "0");
  const [dirty, setDirty] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const formRef = useRef<HTMLFormElement>(null);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Math.round(Number(line.quantity || 0) * (pkrToPaisa(line.price) ?? 0)), 0), [lines]);
  const total = Math.max(0, subtotal - (pkrToPaisa(discount) ?? 0) + (pkrToPaisa(tax) ?? 0));
  useEffect(() => { if (state.destination) router.push(state.destination); }, [state.destination, router]);
  useEffect(() => { if (state.field) formRef.current?.querySelector<HTMLElement>(`[name="${state.field}"]`)?.focus(); }, [state.field]);
  useEffect(() => { const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty && !state.destination) event.preventDefault(); }; window.addEventListener("beforeunload", beforeUnload); return () => window.removeEventListener("beforeunload", beforeUnload); }, [dirty, state.destination]);
  const updateLine = (index: number, patch: Partial<Line>) => { setDirty(true); setLines(current => current.map((line, i) => i === index ? { ...line, ...patch } : line)); };
  const payload = lines.map(line => ({ ...(line.product_id ? { product_id: line.product_id } : {}), description: line.description.trim(), quantity: line.quantity, unit_price_paisa: pkrToPaisa(line.price) ?? -1 }));
  return <form ref={formRef} action={action} onChange={() => setDirty(true)} className="module-form-layout"><input type="hidden" name="operation_key" value={key} />{initial && <><input type="hidden" name="quotation_id" value={initial.id} /><input type="hidden" name="expected_version" value={initial.version} /></>}<input type="hidden" name="party_kind" value={partyKind} /><input type="hidden" name="lines" value={JSON.stringify(payload)} />
    <div className="module-form-main"><ModuleCard><h2>Party</h2><p className="module-muted">Choose who will receive this offer.</p><div className="module-segment module-kind"><button type="button" className={partyKind === "customer" ? "active" : ""} onClick={() => { setPartyKind("customer"); setPartyId(""); }}>Customer</button><button type="button" className={partyKind === "lead" ? "active" : ""} onClick={() => { setPartyKind("lead"); setPartyId(""); }}>Lead</button></div><label className="module-field">{partyKind === "customer" ? "Customer" : "Lead"}<select name="party_id" required value={partyId} onChange={event => setPartyId(event.target.value)}><option value="">Choose {partyKind}</option>{(partyKind === "customer" ? customers : leads).map(party => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>{(partyKind === "customer" ? customers : leads).length === 0 && <p className="module-hint">No {partyKind}s available. Create one first.</p>}</ModuleCard>
      <ModuleCard><h2>Dates</h2><div className="module-grid-two"><label className="module-field">Issue date<input name="issue_date" type="date" required defaultValue={initial?.issueDate ?? today} /></label><label className="module-field">Valid until<input name="valid_until" type="date" required defaultValue={initial?.validUntil ?? expiry.toISOString().slice(0, 10)} min={initial?.issueDate ?? today} /></label></div></ModuleCard>
      <ModuleCard><div className="module-card-title"><div><h2>Items</h2><p className="module-muted">Select a product or write a custom item.</p></div><button type="button" className="module-secondary" disabled={lines.length >= 200} onClick={() => { setLines(current => [...current, { ...initialLine }]); setDirty(true); }}>+ Add item</button></div><div className="module-line-list">{lines.map((line, index) => <div className="module-line" key={index}><div className="module-description"><label className="module-field">Product<select value={line.product_id ?? ""} onChange={event => { const product = products.find(item => item.id === event.target.value); updateLine(index, { product_id: product?.id, description: product?.name ?? line.description, price: product ? (product.price_paisa / 100).toFixed(2) : line.price }); }}><option value="">Custom item</option>{products.map(product => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label className="module-field">Description<input dir="auto" required maxLength={500} value={line.description} onChange={event => updateLine(index, { description: event.target.value })} /></label></div><label className="module-field">Quantity<input required inputMode="decimal" value={line.quantity} onChange={event => updateLine(index, { quantity: event.target.value })} /></label><label className="module-field">Unit price (Rs)<input required inputMode="decimal" value={line.price} onChange={event => updateLine(index, { price: event.target.value })} /></label><div className="module-line-total"><span>Line total</span><strong>{formatPkr(Math.round(Number(line.quantity || 0) * (pkrToPaisa(line.price) ?? 0)))}</strong></div><button type="button" className="module-remove" aria-label={`Remove item ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines(current => current.filter((_, i) => i !== index))}>×</button></div>)}</div></ModuleCard>
      <ModuleCard><h2>Notes and terms</h2><div className="module-grid-two"><label className="module-field">Internal notes<textarea name="notes" dir="auto" maxLength={1000} rows={4} defaultValue={initial?.notes} /></label><label className="module-field">Terms for customer<textarea name="terms" dir="auto" maxLength={2000} rows={4} defaultValue={initial?.terms} /></label></div></ModuleCard></div>
    <aside className="module-form-aside"><ModuleCard><h2>Estimated total</h2><p className="module-muted">The API calculates the final saved amount.</p><div className="module-total-row"><span>Subtotal</span><strong>{formatPkr(subtotal)}</strong></div><label className="module-field">Discount (Rs)<input name="discount" inputMode="decimal" value={discount} onChange={event => setDiscount(event.target.value)} /></label>{(pkrToPaisa(discount) ?? Infinity) > subtotal && <p className="module-error">Discount cannot exceed subtotal.</p>}<label className="module-field">Tax (Rs)<input name="tax" inputMode="decimal" value={tax} onChange={event => setTax(event.target.value)} /></label><div className="module-total-row module-grand-total"><span>Total</span><strong>{formatPkr(total)}</strong></div></ModuleCard></aside>
    {state.error && <p role="alert" className="module-error module-submit-error">{state.error}</p>}<div className="module-form-footer"><Link href="/quotations" className="module-secondary" onClick={event => { if (dirty && !window.confirm("Discard your unsaved changes?")) event.preventDefault(); }}>Cancel</Link><button type="submit" disabled={pending || !partyId} name="send" value="no">{pending ? "Saving…" : "Save draft"}</button><button type="submit" disabled={pending || !partyId} name="send" value="yes">{pending ? "Saving…" : "Save and send"}</button></div>
  </form>;
}
