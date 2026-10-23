import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { ReturnActions } from "@/components/modules/return-actions";
import { moduleDetail, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";
import { record } from "@/lib/api";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await moduleDetail(`/returns/${encodeURIComponent(id)}`);
  const lines = Array.isArray(data.lines) ? data.lines.map(record) : [];
  return <div className="module-page"><ModuleHeader eyebrow="SALES / RETURNS / DETAIL" title={error ? "Return" : value(data, "number", "return_number")} description={error ?? `Status: ${value(data, "status")}`} />{error ? <ModuleCard><p role="alert">{error}</p><Link href={`/returns/${id}`}>Retry</Link></ModuleCard> : <><ModuleCard><div className="detail-summary"><div><span>Order</span><strong>{value(data, "order.number", "order_number")}</strong></div><div><span>Customer</span><strong>{value(data, "customer.name", "customer_name")}</strong></div><div><span>Reason</span><strong>{value(data, "reason")}</strong></div><div><span>Created</span><strong>{formatDate(data.created_at)}</strong></div><div><span>Resolution</span><strong>{value(data, "resolution")}</strong></div><div><span>Total</span><strong>{formatPkr(Number(data.total_paisa ?? 0))}</strong></div></div></ModuleCard><ModuleCard><h2>Returned items</h2><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Item</th><th>Quantity</th><th className="money-cell">Amount</th></tr></thead><tbody>{lines.map((line, index) => <tr key={String(line.id ?? index)}><td>{value(line, "description", "product.name")}</td><td>{value(line, "quantity")}</td><td className="money-cell">{formatPkr(Number(line.total_paisa ?? 0))}</td></tr>)}</tbody></table></div></ModuleCard>{data.note && <ModuleCard><h2>Reason note</h2><p dir="auto">{String(data.note)}</p></ModuleCard>}{data.status === "draft" && <ReturnActions id={id} version={Number(data.version ?? 0)} />}{data.credit_note_id && <Link className="module-secondary" href={`/credit-notes/${data.credit_note_id}`}>View credit note</Link>}</>}</div>;
}
