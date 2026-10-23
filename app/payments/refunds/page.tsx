import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { RefundCreateForm } from "@/components/modules/refund-create-form";
import { moduleList, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; from?: string; to?: string }> }) {
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const [refunds, customers, accounts] = await Promise.all([
    moduleList("/refunds", { page, limit: 20, from: query.from || undefined, to: query.to || undefined }),
    moduleList("/customers", { limit: 100 }), moduleList("/payment-accounts", { limit: 100 }),
  ]);
  const href = (next: number) => `/payments/refunds?page=${next}${query.from ? `&from=${encodeURIComponent(query.from)}` : ""}${query.to ? `&to=${encodeURIComponent(query.to)}` : ""}`;
  return <div className="module-page"><ModuleHeader eyebrow="MONEY / PAYMENTS" title="Refunds" description="Track money returned to customers and record new refunds." />
    <ModuleCard><form className="module-filter" action="/payments/refunds"><label className="module-field">From<input name="from" type="date" defaultValue={query.from} /></label><label className="module-field">To, exclusive<input name="to" type="date" defaultValue={query.to} /></label><button type="submit">Apply dates</button></form>{refunds.error ? <div className="module-state" role="alert">{refunds.error}</div> : refunds.rows.length ? <><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Customer</th><th>Order</th><th>Date</th><th>Method</th><th>Reason</th><th className="money-cell">Amount</th></tr></thead><tbody>{refunds.rows.map((row, index) => <tr key={String(row.id ?? index)}><td>{value(row, "customer.name", "customer_name")}</td><td>{row.order_id ? <Link href={`/orders/${row.order_id}`}>{value(row, "order.order_number", "order_number")}</Link> : "Customer credit"}</td><td>{formatDate(row.created_at ?? row.refunded_at)}</td><td>{value(row, "method")}</td><td>{value(row, "reason")}</td><td className="money-cell">{formatPkr(Number(row.amount_paisa ?? 0))}</td></tr>)}</tbody></table></div><nav className="module-pagination" aria-label="Refund pages">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}<span>Page {page}</span>{refunds.rows.length === 20 && <Link href={href(page + 1)}>Next</Link>}</nav></> : <div className="module-state">No refunds in this period.</div>}</ModuleCard>
    <RefundCreateForm customers={customers.rows.map(row => ({ id: String(row.id), name: value(row, "name", "business_name") }))} accounts={accounts.rows.filter(row => row.status === "active" || row.is_active === true).map(row => ({ id: String(row.id), name: value(row, "name") }))} />
  </div>;
}
