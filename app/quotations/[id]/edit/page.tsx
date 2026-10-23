import Link from "next/link";
import { Suspense } from "react";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { QuotationDraftForm, type QuotationInitial } from "@/components/modules/quotation-draft-form";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { record } from "@/lib/api";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / EDIT" title="Edit quotation" description="Loading quotation…" /></div>}><EditQuotationContent params={params} /></Suspense>;
}

async function EditQuotationContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, customers, leads, products] = await Promise.all([moduleDetail(`/quotations/${encodeURIComponent(id)}`), moduleList("/customers", { limit: 100 }), moduleList("/leads", { limit: 100 }), moduleList("/products", { limit: 100 })]);
  const quote = result.data;
  const initial: QuotationInitial = { id, version: Number(quote.version ?? 0), partyKind: quote.lead_id ? "lead" : "customer", partyId: String(quote.lead_id ?? quote.customer_id ?? ""), issueDate: String(quote.issue_date ?? "").slice(0, 10), validUntil: String(quote.valid_until ?? "").slice(0, 10), lines: (Array.isArray(quote.lines) ? quote.lines.map(record) : []).map(line => ({ product_id: typeof line.product_id === "string" ? line.product_id : undefined, description: String(line.description ?? ""), quantity: String(line.quantity ?? "1"), price: (Number(line.unit_price_paisa ?? 0) / 100).toFixed(2) })), discount: (Number(quote.discount_paisa ?? 0) / 100).toFixed(2), tax: (Number(quote.tax_paisa ?? 0) / 100).toFixed(2), notes: String(quote.notes ?? ""), terms: String(quote.terms ?? "") };
  return <div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / EDIT" title={`Edit ${value(quote, "number", "quotation_number")}`} description="Update this draft quotation." />{result.error || quote.status !== "draft" ? <ModuleCard><p role="alert">{result.error ?? "Only draft quotations can be edited."}</p><Link href={`/quotations/${id}`}>Back to quotation</Link></ModuleCard> : <QuotationDraftForm initial={initial} customers={customers.rows.map(row => ({ id: String(row.id), name: value(row, "name") }))} leads={leads.rows.map(row => ({ id: String(row.id), name: value(row, "name") }))} products={products.rows.map(row => ({ id: String(row.id), name: value(row, "name"), price_paisa: Number(row.price_paisa ?? 0) }))} />}</div>;
}
