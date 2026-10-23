import { ModuleCard } from "@/components/modules/module-ui";
import { Suspense } from "react";
import { PrintTrigger } from "@/components/modules/print-trigger";
import { moduleDetail, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";
import { record } from "@/lib/api";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="print-document"><div className="module-list-skeleton" role="status" aria-label="Loading quotation print view"><div /><div /><div /><div /></div></div>}><QuotationPrintContent params={params} /></Suspense>;
}

async function QuotationPrintContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await moduleDetail(`/quotations/${encodeURIComponent(id)}/print-data`);
  const lines = Array.isArray(data.lines) ? data.lines.map(record) : [];
  return <div className="print-document"><PrintTrigger />{error ? <ModuleCard><p role="alert">{error}</p></ModuleCard> : <>{data.is_draft === true && <div className="print-draft-mark">DRAFT</div>}<header><strong>{value(data, "business.name", "organization.name")}</strong><span>QUOTATION</span></header><div className="print-document-head"><div><h1>{value(data, "number", "quotation_number")}</h1><p>Valid until {formatDate(data.valid_until)}</p></div><div><span>Prepared for</span><strong>{value(data, "party.name", "customer.name", "lead.name", "party_name")}</strong></div></div><table><thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>{lines.map((line, index) => <tr key={String(line.id ?? index)}><td>{value(line, "description", "product.name")}</td><td>{value(line, "quantity")}</td><td>{formatPkr(Number(line.unit_price_paisa ?? 0))}</td><td>{formatPkr(Number(line.line_total_paisa ?? line.total_paisa ?? 0))}</td></tr>)}</tbody></table><div className="print-totals"><div><span>Subtotal</span><strong>{formatPkr(Number(data.subtotal_paisa ?? 0))}</strong></div><div><span>Discount</span><strong>{formatPkr(Number(data.discount_paisa ?? 0))}</strong></div><div><span>Tax</span><strong>{formatPkr(Number(data.tax_paisa ?? 0))}</strong></div><div className="grand"><span>Total</span><strong>{formatPkr(Number(data.total_paisa ?? 0))}</strong></div></div>{data.terms && <section><h2>Terms</h2><p dir="auto">{String(data.terms)}</p></section>}<footer>This is a quotation, not a tax invoice.</footer></>}</div>;
}
