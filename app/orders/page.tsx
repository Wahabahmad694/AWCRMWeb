import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Clock3, CreditCard, PackageCheck, ShoppingBag } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Query = { page?: string; search?: string; status?: string; payment?: string; sort?: string };
const pageSize = 20;
function text(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function money(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "—"; }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
function pageHref(query: Query, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  for (const key of ["search", "status", "payment", "sort"] as const) if (query[key]) params.set(key, query[key]);
  return `/orders?${params}`;
}
export default function OrdersPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Orders" />}><OrdersContent searchParams={searchParams} /></Suspense>;
}
async function OrdersContent({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    status: ["draft", "confirmed", "processing", "fulfilled", "cancelled", "returned"].includes(raw.status || "") ? raw.status : "",
    payment: ["paid", "partial", "unpaid", "refunded"].includes(raw.payment || "") ? raw.payment : "",
    sort: raw.sort === "oldest" || raw.sort === "amount" ? raw.sort : "recent",
  };
  const page = Number(query.page);
  let data: unknown = null;
  let organizationName = "WORKSPACE";
  let error = "";
  let noOrganization = false;
  try {
    const workspace = await getWorkspace("/orders");
    organizationName = text(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) data = await apiRequest("/orders", { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: pageSize, ...(query.search ? { search: query.search } : {}) } });
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to orders." : cause instanceof Error ? cause.message : "Unable to load orders."; }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const visible = rows.filter(row => (!query.status || String(row.status ?? "").toLowerCase() === query.status) && (!query.payment || String(row.payment_status ?? "").toLowerCase() === query.payment)).sort((a, b) => {
    if (query.sort === "amount") return Number(b.total_paisa ?? 0) - Number(a.total_paisa ?? 0);
    const difference = String(b.created_at ?? b.createdAt ?? "").localeCompare(String(a.created_at ?? a.createdAt ?? ""));
    return query.sort === "oldest" ? -difference : difference;
  });
  const pageTotal = visible.reduce((sum, row) => sum + (typeof row.total_paisa === "number" ? row.total_paisa : 0), 0);
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const filtered = Boolean(query.search || query.status || query.payment);
  return <div className="orders-page">
    <header className="orders-header"><div><div className="module-eyebrow">{organizationName} / SALES</div><h1>Orders<span>.</span></h1><p>Keep sales moving from placement to fulfillment.</p></div><a href="#create-order" className="orders-primary">+ Create order</a></header>
    <section className="orders-summary" aria-label="Order overview">
      <article><span className="orders-summary-icon blue"><ShoppingBag size={19} /></span><div><small>Orders found</small><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><p>{total === undefined ? "On this page" : query.search ? "Matching search" : "In your workspace"}</p></div></article>
      <article><span className="orders-summary-icon teal"><PackageCheck size={19} /></span><div><small>Shown on this page</small><strong>{visible.length}</strong><p>{query.status || query.payment ? "Matching page filters" : `Page ${page}`}</p></div></article>
      <article><span className="orders-summary-icon amber"><Clock3 size={19} /></span><div><small>Awaiting payment</small><strong>{visible.filter(row => String(row.payment_status ?? "").toLowerCase() === "unpaid").length}</strong><p>Among shown orders</p></div></article>
      <article><span className="orders-summary-icon violet"><CreditCard size={19} /></span><div><small>Shown order value</small><strong>{money(pageTotal)}</strong><p>Among shown orders</p></div></article>
    </section>
    <section className="orders-panel orders-filter-panel" aria-label="Find orders"><form action="/orders" method="get" className="orders-filters">
      <label className="orders-search"><span>Search orders</span><input name="search" type="search" defaultValue={query.search} placeholder="Order number or customer" /></label>
      <label><span>Order status</span><select name="status" defaultValue={query.status}><option value="">All statuses</option>{["draft", "confirmed", "processing", "fulfilled", "cancelled", "returned"].map(value => <option value={value} key={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label>
      <label><span>Payment</span><select name="payment" defaultValue={query.payment}><option value="">All payments</option>{["paid", "partial", "unpaid", "refunded"].map(value => <option value={value} key={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label>
      <label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="recent">Most recent</option><option value="oldest">Oldest first</option><option value="amount">Highest value</option></select></label>
      <button type="submit">Apply filters</button>{filtered && <Link href="/orders" className="orders-clear">Clear</Link>}
    </form><p className="orders-filter-note">Status, payment, and sort refine the current page of results.</p></section>
    <section className="orders-panel orders-list" aria-label="Order records"><div className="orders-list-heading"><div><h2>All orders</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {visible.length} shown</p></div><span>Values in PKR</span></div>
      {error ? <div className="orders-state" role="alert">{error}</div> : noOrganization ? <div className="orders-state">Select or create an organization to view orders.</div> : data === null ? <div className="orders-state">Order data is unavailable.</div> : visible.length === 0 ? <div className="orders-state"><strong>{filtered ? "No matching orders" : "Ready for your first order"}</strong><p>{filtered ? "Try a different search or clear the filters." : "Create an order to start tracking sales and fulfillment."}</p>{filtered && <Link href="/orders">Clear filters</Link>}</div> : <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th>Payment</th><th>Total</th><th aria-label="Open order" /></tr></thead><tbody>{visible.map((row, index) => {
        const id = typeof row.id === "string" ? row.id : "";
        const number = text(row.order_number ?? row.number);
        const customer = text(row.customer_name ?? record(row.customer).name ?? row.customer_id);
        return <tr key={id || index}><td><div className="orders-order-id"><span className="orders-order-icon"><ShoppingBag size={16} /></span><div>{id ? <Link href={`/orders/${encodeURIComponent(id)}`}>{number}</Link> : <strong>{number}</strong>}<small>{text(row.channel) !== "—" ? String(row.channel) : "Order"}</small></div></div></td><td className="orders-customer">{customer}</td><td>{date(row.created_at ?? row.createdAt)}</td><td><StatusBadge value={String(row.status ?? "—")} /></td><td><StatusBadge value={String(row.payment_status ?? "—")} /></td><td className="orders-amount">{money(row.total_paisa)}</td><td>{id && <Link className="orders-view" href={`/orders/${encodeURIComponent(id)}`} aria-label={`View order ${number}`}>View <ArrowUpRight size={14} /></Link>}</td></tr>;
      })}</tbody></table></div>}
    </section>
    {data !== null && rows.length > 0 && <nav className="pagination" aria-label="Order pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={pageHref(query, page - 1)}>Previous</Link>}{hasNext && <Link href={pageHref(query, page + 1)}>Next</Link>}</div></nav>}
    <div id="create-order" className="orders-create"><OperationForm operationId="order.create" defaultOpen /></div>
  </div>;
}
