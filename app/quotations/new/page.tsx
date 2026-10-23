import { ModuleHeader } from "@/components/modules/module-ui";
import { Suspense } from "react";
import { QuotationDraftForm } from "@/components/modules/quotation-draft-form";
import { moduleList, value } from "@/lib/module-data";

export default function NewQuotationPage({ searchParams }: { searchParams: Promise<{ lead?: string; customer?: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / NEW" title="New quotation" description="Loading form options…" /></div>}><NewQuotationContent searchParams={searchParams} /></Suspense>;
}

async function NewQuotationContent({ searchParams }: { searchParams: Promise<{ lead?: string; customer?: string }> }) {
  const prefill = await searchParams;
  const [customers, leads, products] = await Promise.all([moduleList("/customers", { limit: 100 }), moduleList("/leads", { limit: 100 }), moduleList("/products", { limit: 100 })]);
  return <div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / NEW" title="New quotation" description="Prepare an offer with a party, validity dates, items, and terms." /><QuotationDraftForm customers={customers.rows.map(row => ({ id: String(row.id), name: value(row, "name") }))} leads={leads.rows.map(row => ({ id: String(row.id), name: value(row, "name") }))} products={products.rows.map(row => ({ id: String(row.id), name: value(row, "name"), price_paisa: Number(row.price_paisa ?? 0) }))} defaultPartyKind={prefill.lead ? "lead" : "customer"} defaultPartyId={prefill.lead ?? prefill.customer ?? ""} /></div>;
}
