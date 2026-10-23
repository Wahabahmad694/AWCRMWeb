import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { WhatsAppFollowup } from "@/components/modules/whatsapp-followup";
import { formatDate, formatPkr, karachiToday } from "@/lib/crm-format";
import { record } from "@/lib/api";
import { QuotationActions } from "@/components/modules/quotation-actions";

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / DETAIL" title="Quotation" description="Loading quotation…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading quotation"><div /><div /><div /><div /></div></ModuleCard></div>}><QuotationDetailContent params={params} /></Suspense>;
}

async function QuotationDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, templates] = await Promise.all([moduleDetail(`/quotations/${encodeURIComponent(id)}`), moduleList("/message-templates", { context: "quotation" })]);
  const quote = result.data;
  const lines = Array.isArray(quote.lines) ? quote.lines.map(record) : [];
  await io();
  const expired = String(quote.valid_until ?? "").slice(0, 10) < karachiToday();
  return <div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / DETAIL" title={result.error ? "Quotation" : value(quote, "number", "quotation_number")} description={result.error ?? `Status: ${value(quote, "status")}`} />{result.error ? <ModuleCard><p role="alert">{result.error}</p><Link href={`/quotations/${id}`}>Retry</Link></ModuleCard> : <><ModuleCard><div className="detail-summary"><div><span>Party</span><strong>{value(quote, "party.name", "customer.name", "lead.name", "party_name")}</strong></div><div><span>Issue date</span><strong>{formatDate(quote.issue_date)}</strong></div><div><span>Valid until</span><strong>{formatDate(quote.valid_until)}</strong></div><div><span>Total</span><strong>{formatPkr(Number(quote.total_paisa ?? 0))}</strong></div></div></ModuleCard><ModuleCard><h2>Items</h2><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Description</th><th>Quantity</th><th className="money-cell">Unit price</th><th className="money-cell">Total</th></tr></thead><tbody>{lines.map((line, index) => <tr key={String(line.id ?? index)}><td>{value(line, "description", "product.name")}</td><td>{value(line, "quantity")}</td><td className="money-cell">{formatPkr(Number(line.unit_price_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(line.line_total_paisa ?? line.total_paisa ?? 0))}</td></tr>)}</tbody></table></div></ModuleCard>{quote.notes && <ModuleCard><h2>Notes</h2><p dir="auto">{String(quote.notes)}</p></ModuleCard>}{quote.terms && <ModuleCard><h2>Terms</h2><p dir="auto">{String(quote.terms)}</p></ModuleCard>}{(quote.customer_id || quote.lead_id) && <WhatsAppFollowup targetType={quote.lead_id ? "lead" : "customer"} targetId={String(quote.lead_id ?? quote.customer_id)} phone={String(record(quote.party).phone ?? record(quote.customer).phone ?? record(quote.lead).phone ?? "")} optedOut={quote.whatsapp_opted_out === true} context="quotation" relatedId={id} templates={templates.rows.map(row => ({ id: String(row.id), name: value(row, "name"), language: value(row, "locale") }))} />}<QuotationActions id={id} status={String(quote.status ?? "")} version={Number(quote.version ?? 0)} expired={expired} /></>}</div>;
}
