import Link from "next/link";
import { Suspense } from "react";
import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

function DashboardFallback() {
  return <div className="page-wrap" aria-busy="true"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>Business dashboard</h1><p>Your latest business snapshot.</p></div></div><section className="panel resource-state" role="status">Loading dashboard…</section></div>;
}

export default function Dashboard() {
  return <Suspense fallback={<DashboardFallback />}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const workspace = await getWorkspace();
  let summary: Record<string, unknown> = {};
  let error = "";
  if (workspace.organizationId) {
    try { summary = unwrap(await apiRequest("/dashboard/summary", { token: workspace.token, organizationId: workspace.organizationId })); }
    catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load the dashboard."; }
  }
  const fetchList = async (path: string, query?: Record<string,number>) => {
    if (!workspace.organizationId) return [];
    try { return items(await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query })); }
    catch { return []; }
  };
  const [trends, orders, activities, reminders, lowStock] = await Promise.all([
    fetchList("/sales/trends"), fetchList("/orders", {page:1,limit:5}), fetchList("/activities", {page:1,limit:5}), fetchList("/reminders", {page:1,limit:5}), fetchList("/inventory/low-stock"),
  ]);
  const today = record(summary.today);
  const month = record(summary.month_to_date);
  const receivables = record(summary.receivables);
  const metrics = [
    { label: "Sales today", value: today.net_sales_paisa, money: true },
    { label: "Orders today", value: today.orders },
    { label: "Sales this month", value: month.net_sales_paisa, money: true },
    { label: "Orders this month", value: month.orders },
    { label: "Cash collected", value: month.net_collected_paisa, money: true },
    { label: "Receivables", value: receivables.outstanding_paisa, money: true },
    { label: "Expenses", value: month.expenses_paisa, money: true },
    { label: "Estimated operating profit", value: month.estimated_operating_profit_paisa, money: true },
  ].filter(metric => typeof metric.value === "number");
  const recentOrders = items(summary.recent_orders).length ? items(summary.recent_orders) : orders;
  const followUps = items(summary.due_follow_ups ?? summary.follow_ups).length ? items(summary.due_follow_ups ?? summary.follow_ups) : reminders;
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">{String(workspace.organization?.name ?? "OVERVIEW")}</div><h1>Business dashboard</h1><p>Your latest business snapshot.</p></div></div>
    {error && <div className="notice" role="alert">{error}</div>}{!workspace.organizationId && <div className="notice">Create an organization in settings to view business data.</div>}
    <section aria-labelledby="snapshot-title"><div className="section-title"><h2 id="snapshot-title">Business snapshot</h2></div>{metrics.length ? <div className="metric-grid">{metrics.map(metric => <article className="metric-card" key={metric.label}><div className="metric-top">{metric.label}</div><div className="metric-value">{metric.money ? formatPaisa(metric.value as number) : String(metric.value)}</div></article>)}</div> : <div className="panel resource-state">No dashboard figures available.</div>}</section>
    <div className="lower-grid"><section className="panel compact-panel"><div className="panel-heading"><h2>Sales trend</h2><Link href="/reports">Reports</Link></div>{trends.length ? <ul className="summary-list">{trends.slice(0,6).map((point,index) => <li key={index}><span>{String(point.period_start ?? point.period ?? point.date ?? "Period")}</span><strong>{typeof point.net_sales_paisa === "number" ? formatPaisa(point.net_sales_paisa) : "—"}</strong></li>)}</ul> : <p className="panel-empty">No trend data available.</p>}</section><section className="panel compact-panel"><div className="panel-heading"><h2>Low stock</h2><Link href="/inventory/low-stock">View all</Link></div>{lowStock.length ? <ul className="summary-list">{lowStock.slice(0,6).map((product,index) => <li key={String(product.id ?? index)}><span>{String(product.product_name ?? product.name ?? record(product.product).name ?? product.sku ?? "Product")}</span><strong>{String(product.on_hand ?? product.quantity ?? "—")}</strong></li>)}</ul> : <p className="panel-empty">No low-stock products.</p>}</section></div>
    <div className="lower-grid"><section className="panel compact-panel"><div className="panel-heading"><h2>Recent orders</h2><Link href="/orders">View all</Link></div>{recentOrders.length ? <ul className="summary-list">{recentOrders.slice(0,5).map((order,index) => <li key={String(order.id ?? index)}><span>{String(order.order_number ?? order.number ?? order.id ?? "Order")}</span><strong>{String(order.status ?? "")}</strong></li>)}</ul> : <p className="panel-empty">No recent orders.</p>}</section><section className="panel compact-panel"><div className="panel-heading"><h2>Due follow-ups</h2><Link href="/activities">View all</Link></div>{followUps.length ? <ul className="summary-list">{followUps.slice(0,5).map((activity,index) => <li key={String(activity.id ?? index)}>{String(activity.subject ?? activity.title ?? "Follow-up")}</li>)}</ul> : <p className="panel-empty">No follow-ups due.</p>}{activities.length > 0 && <p className="section-note">{activities.length} recent activities</p>}</section></div>
  </div>;
}
