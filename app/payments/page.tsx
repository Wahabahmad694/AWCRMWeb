import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, CreditCard, ReceiptText, UsersRound, Wallet } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { directoryOptions } from "@/lib/directory-options";
import { formatPaisa } from "@/lib/display";
import { PaymentTransactionForm } from "@/components/shared/payment-transaction-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const label = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : fallback;
const money = (value: unknown) => typeof value === "number" ? formatPaisa(value) : "—";
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
function totalFrom(value: unknown) {
  const envelope = record(value);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  return typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
}

export default function PaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Payments" />}><PaymentsContent searchParams={searchParams} /></Suspense>;
}

async function PaymentsContent({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  let organizationName = "WORKSPACE";
  let data: unknown = null;
  let paymentError = "";
  let customerError = "";
  let orderError = "";
  let noOrganization = false;
  let customers: { id: string; name: string; detail: string }[] = [];
  let orders: { id: string; number: string; customerId: string; total: string }[] = [];
  let customersLimited = false;
  let ordersLimited = false;
  let accounts: { id: string; name: string; type: string }[] = [];

  try {
    const workspace = await getWorkspace("/payments");
    organizationName = label(workspace.organization?.name, "WORKSPACE");
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) {
      const [payments, customerDirectory, orderDirectory, accountDirectory] = await Promise.allSettled([
        apiRequest("/payments", { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: 20 } }),
        directoryOptions("/customers", workspace.token, workspace.organizationId),
        directoryOptions("/orders", workspace.token, workspace.organizationId),
        apiRequest("/payment-accounts", { token: workspace.token, organizationId: workspace.organizationId }),
      ]);
      if (payments.status === "fulfilled") data = payments.value;
      else paymentError = payments.reason instanceof ApiError ? payments.reason.message : "Unable to load payments.";
      if (customerDirectory.status === "fulfilled") {
        customersLimited = customerDirectory.value.limited;
        customers = customerDirectory.value.rows.filter(row => typeof row.id === "string" && typeof row.name === "string").map(row => ({ id: String(row.id), name: String(row.name), detail: label(row.business_name, label(row.code, "")) }));
      } else customerError = customerDirectory.reason instanceof ApiError ? customerDirectory.reason.message : "Unable to load customers.";
      if (accountDirectory.status === "fulfilled") accounts = items(accountDirectory.value).filter(row => row.status !== "inactive" && row.active !== false && typeof row.id === "string").map(row => ({ id: String(row.id), name: String(row.name ?? "Account"), type: String(row.type ?? "") }));
      if (orderDirectory.status === "fulfilled") {
        ordersLimited = orderDirectory.value.limited;
        orders = orderDirectory.value.rows.filter(row => typeof row.id === "string").map(row => ({ id: String(row.id), number: label(row.order_number ?? row.number, "Order"), customerId: String(row.customer_id ?? record(row.customer).id ?? ""), total: money(row.total_paisa) }));
      } else orderError = orderDirectory.reason instanceof ApiError ? orderDirectory.reason.message : "Unable to load orders.";
    }
  } catch (error) { paymentError = error instanceof ApiError ? error.message : "Unable to load your workspace."; }

  const rows = items(data);
  const total = totalFrom(data);
  const hasNext = total === undefined ? rows.length === 20 : page * 20 < total;
  const amount = rows.reduce((sum, row) => sum + (typeof row.amount_paisa === "number" ? row.amount_paisa : 0), 0);
  const customerNames = new Map(customers.map(customer => [customer.id, customer.name]));
  const orderNumbers = new Map(orders.map(order => [order.id, order.number]));

  return <div className="payments-page"><header className="payments-header"><div><div className="module-eyebrow">{organizationName} / FINANCE</div><h1>Payments<span>.</span></h1><p>Record collections and keep every transaction easy to trace.</p></div><div><Link href="/payments/receivables" className="payments-secondary">Receivables <ArrowUpRight size={14} /></Link><Link href="/payments/refunds" className="payments-secondary">Refunds <ArrowUpRight size={14} /></Link><a href="#record-payment" className="payments-primary">+ Record payment</a></div></header>
    <section className="payments-metrics" aria-label="Payment overview"><article><span className="payments-metric-icon blue"><CreditCard size={20} /></span><div><small>Payments found</small><strong>{total ?? rows.length}</strong><p>{total === undefined ? "On this page" : "Across your workspace"}</p></div></article><article><span className="payments-metric-icon mint"><Wallet size={20} /></span><div><small>Collected on this page</small><strong>{money(amount)}</strong><p>Shown payment records</p></div></article><article><span className="payments-metric-icon violet"><UsersRound size={20} /></span><div><small>Customers</small><strong>{customers.length}</strong><p>Available to select</p></div></article></section>
    <div className="payments-layout"><PaymentTransactionForm mode="payment" customers={customers} orders={orders} accounts={accounts} customerError={customerError} orderError={orderError} customersLimited={customersLimited} ordersLimited={ordersLimited} /><aside className="payments-aside"><section className="payments-aside-card"><span><ReceiptText size={20} /></span><h2>Keep payments connected</h2><p>Choose a customer and optionally attach an order. The right record IDs are submitted with your payment.</p><Link href="/orders">Browse orders <ArrowUpRight size={15} /></Link></section><PaymentTransactionForm mode="refund" customers={customers} orders={orders} accounts={accounts} customerError={customerError} orderError={orderError} customersLimited={customersLimited} ordersLimited={ordersLimited} /></aside></div>
    <section className="payments-list" aria-label="Payment records"><div className="payments-list-heading"><div><span>COLLECTIONS</span><h2>Recent payments</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {rows.length} shown</p></div><span>Values in PKR</span></div>
      {paymentError ? <div className="payments-state" role="alert">{paymentError}</div> : noOrganization ? <div className="payments-state">Select or create an organization to view payments.</div> : data === null ? <div className="payments-state">Payment data is unavailable.</div> : rows.length === 0 ? <div className="payments-state"><span><CreditCard size={28} /></span><strong>No payments recorded yet</strong><p>Record a payment to start your collection history.</p></div> : <div className="payments-table-scroll"><table className="payments-table"><thead><tr><th>Payment</th><th>Customer</th><th>Order</th><th>Received</th><th>Method</th><th>Status</th><th>Amount</th><th aria-label="Open payment" /></tr></thead><tbody>{rows.map((row, index) => { const id = typeof row.id === "string" ? row.id : ""; const reference = label(row.reference, "Payment"); return <tr key={id || index}><td><div className="payments-table-name"><span><CreditCard size={15} /></span><div>{id ? <Link href={`/payments/${encodeURIComponent(id)}`}>{reference}</Link> : <strong>{reference}</strong>}<small>{id ? `#${id.slice(0, 8)}` : "Collection"}</small></div></div></td><td>{label(row.customer_name, customerNames.get(String(row.customer_id ?? "")) ?? "—")}</td><td>{orderNumbers.get(String(row.order_id ?? "")) ?? label(row.order_number)}</td><td>{date(row.received_at ?? row.created_at)}</td><td className="payments-method">{label(row.method).replaceAll("_", " ")}</td><td><StatusBadge value={String(row.status ?? "—")} /></td><td className="payments-amount">{money(row.amount_paisa)}</td><td>{id && <Link href={`/payments/${encodeURIComponent(id)}`} className="payments-view">View <ArrowUpRight size={14} /></Link>}</td></tr>; })}</tbody></table></div>}
    </section>{data !== null && rows.length > 0 && <nav className="pagination" aria-label="Payment pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={`/payments?page=${page - 1}`}>Previous</Link>}{hasNext && <Link href={`/payments?page=${page + 1}`}>Next</Link>}</div></nav>}
  </div>;
}
