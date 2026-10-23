import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { CreditActions } from "@/components/modules/credit-actions";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";
import { record } from "@/lib/api";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await moduleDetail(`/credit-notes/${encodeURIComponent(id)}`);
  const applications = Array.isArray(data.applications) ? data.applications.map(record) : [];
  const orders = data.customer_id ? await moduleList("/orders", { customer_id: String(data.customer_id), status: "outstanding", limit: 100 }) : { rows: [] };
  return <div className="module-page"><ModuleHeader eyebrow="MONEY / CREDIT NOTES / DETAIL" title={error ? "Credit note" : value(data, "number", "credit_note_number")} description={error ?? `Status: ${value(data, "status")}`} />{error ? <ModuleCard><p role="alert">{error}</p><Link href={`/credit-notes/${id}`}>Retry</Link></ModuleCard> : <><ModuleCard><div className="detail-summary"><div><span>Customer</span><strong>{value(data, "customer.name", "customer_name")}</strong></div><div><span>Amount</span><strong>{formatPkr(Number(data.amount_paisa ?? 0))}</strong></div><div><span>Remaining</span><strong>{formatPkr(Number(data.remaining_paisa ?? 0))}</strong></div><div><span>Issued</span><strong>{formatDate(data.issued_at ?? data.created_at)}</strong></div></div></ModuleCard><ModuleCard><h2>Applications</h2><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Order</th><th>Date</th><th className="money-cell">Amount</th></tr></thead><tbody>{applications.map((application, index) => <tr key={String(application.id ?? index)}><td>{value(application, "order.number", "order_number")}</td><td>{formatDate(application.created_at)}</td><td className="money-cell">{formatPkr(Number(application.amount_paisa ?? 0))}</td></tr>)}</tbody></table></div>{applications.length === 0 && <p className="module-state">No applications yet.</p>}</ModuleCard><div className="module-actions"><Link className="module-secondary" href={`/credit-notes/${id}/print`}>Print credit note</Link></div>{data.status === "open" && <CreditActions id={id} remainingPaisa={Number(data.remaining_paisa ?? 0)} orders={orders.rows.filter(row => Number(row.outstanding_paisa ?? 0) > 0).map(row => ({ id: String(row.id), number: value(row, "number", "order_number"), outstandingPaisa: Number(row.outstanding_paisa) }))} canVoid={applications.length === 0} />}</>}</div>;
}
