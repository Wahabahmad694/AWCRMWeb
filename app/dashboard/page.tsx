import Link from "next/link";
import { Suspense } from "react";
import { ArrowDownLeft, ArrowUpRight, Boxes, ChartNoAxesCombined, CircleDollarSign, ClipboardList, PackageCheck, Plus, Receipt, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SalesChart } from "@/components/shared/sales-chart";
import { StatusBadge } from "@/components/shared/status-badge";

export default function Dashboard() {
  return <Suspense fallback={<WorkspaceSkeleton title="Business overview" dashboard />}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const workspace = await getWorkspace();
  let summary: Record<string, unknown> = {};
  let error = "";
  const fetchList = async (path: string, query?: Record<string,number>) => {
    if (!workspace.organizationId) return { rows: [], error: "" };
    try { return { rows: items(await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query })), error: "" }; }
    catch { return { rows: [], error: "This information couldn’t be loaded. Please try again shortly." }; }
  };
  const [summaryResult, trendResult, orderResult, activityResult, reminderResult, stockResult] = await Promise.all([
    workspace.organizationId ? apiRequest("/dashboard/summary", { token: workspace.token, organizationId: workspace.organizationId }).then(data => ({ data, error: "" })).catch(cause => ({ data: null, error: cause instanceof ApiError ? cause.message : "Unable to load the dashboard." })) : Promise.resolve({ data: null, error: "" }),
    fetchList("/sales/trends"), fetchList("/orders", {page:1,limit:5}), fetchList("/activities", {page:1,limit:5}), fetchList("/reminders", {page:1,limit:5}), fetchList("/inventory/low-stock"),
  ]);
  summary = unwrap(summaryResult.data);
  error = summaryResult.error;
  const today = record(summary.today), month = record(summary.month_to_date), receivables = record(summary.receivables);
  const metrics = [
    { label: "Sales today", value: today.net_sales_paisa, money: true, icon: CircleDollarSign, color: "blue", note: "Net sales today" },
    { label: "Orders today", value: today.orders, icon: ShoppingBag, color: "violet", note: "Orders placed today" },
    { label: "Sales this month", value: month.net_sales_paisa, money: true, icon: ChartNoAxesCombined, color: "teal", note: "Month to date" },
    { label: "Orders this month", value: month.orders, icon: PackageCheck, color: "orange", note: "Month to date" },
    { label: "Cash collected", value: month.net_collected_paisa, money: true, icon: Wallet, color: "teal", note: "Collected this month" },
    { label: "Receivables", value: receivables.outstanding_paisa, money: true, icon: ArrowDownLeft, color: "orange", note: "Outstanding customer balances" },
    { label: "Expenses", value: month.expenses_paisa, money: true, icon: Receipt, color: "violet", note: "Business spending this month" },
    { label: "Operating profit", value: month.estimated_operating_profit_paisa, money: true, icon: ChartNoAxesCombined, color: "blue", note: "Estimated · month to date" },
  ];
  const recentOrders = items(summary.recent_orders).length ? items(summary.recent_orders) : orderResult.rows;
  const followUps = items(summary.due_follow_ups ?? summary.follow_ups).length ? items(summary.due_follow_ups ?? summary.follow_ups) : reminderResult.rows;
  const points = trendResult.rows.filter(point => typeof point.net_sales_paisa === "number").map((point, index) => ({ label: String(point.period_start ?? point.period ?? point.date ?? `Period ${index + 1}`), value: Number(point.net_sales_paisa) }));
  return <div className="page-wrap dashboard-page">
    <div className="page-heading"><div><div className="eyebrow">{String(workspace.organization?.name ?? "YOUR WORKSPACE")} <span className="eyebrow-divider">/</span> OVERVIEW</div><h1>A clearer view of your business<span className="heading-dot">.</span></h1><p>Everything that matters, all in one place.</p></div><Link href="/orders" className="primary-link"><Plus size={17} /> Create an order</Link></div>
    <div className="overview-strip"><span><span className="overview-dot" /> Business overview</span><span>All amounts in <strong>PKR</strong></span></div>
    {error && <div className="notice" role="alert">{error}</div>}{!workspace.organizationId && <div className="notice">Create an organization in <Link href="/settings/manage">workspace settings</Link> to view business data.</div>}
    <section aria-label="Business snapshot"><div className="metric-grid">{metrics.map(({ icon: Icon, ...metric }) => <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className={`metric-icon ${metric.color}`}><Icon size={19} strokeWidth={1.7} /></span></div><div className="metric-value">{typeof metric.value === "number" ? metric.money ? formatPaisa(metric.value) : String(metric.value) : "—"}</div><div className="metric-foot">{typeof metric.value === "number" ? metric.note : "Data unavailable"}</div></article>)}</div></section>
    <div className="lower-grid"><section className="panel compact-panel"><div className="panel-heading"><div><h2>Sales performance</h2><p>Your net sales over time</p></div><Link href="/reports" className="panel-action">Reports <ArrowUpRight size={15} /></Link></div>{trendResult.error ? <p className="panel-empty" role="alert">{trendResult.error}</p> : points.length ? <><SalesChart points={points} />{points.every(point => point.value === 0) && <p className="chart-note">No sales recorded in this period. Your growth story starts with your next order.</p>}</> : <EmptyState compact title="Your next chapter starts here" description="Sales trends will appear as orders are recorded." />}</section>
    <section className="panel compact-panel stock-panel"><div className="panel-heading"><div><h2>Inventory watch</h2><p>Keep your bestsellers ready</p></div><span className="panel-icon"><Boxes size={20} /></span></div>{stockResult.error ? <p className="panel-empty" role="alert">{stockResult.error}</p> : stockResult.rows.length ? <ul className="summary-list">{stockResult.rows.slice(0,5).map((product,index) => <li key={String(product.id ?? index)}><span>{String(product.product_name ?? product.name ?? record(product.product).name ?? product.sku ?? "Product")}</span><strong>{String(product.on_hand ?? product.quantity ?? "—")} left</strong></li>)}</ul> : <EmptyState compact title="No low-stock alerts" description="Your low-stock products will be highlighted here, so you can plan ahead." />}<Link href="/inventory/low-stock" className="panel-footer-link">Explore inventory <ArrowUpRight size={15} /></Link></section></div>
    <div className="lower-grid"><section className="panel compact-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>The latest activity in your pipeline</p></div><Link href="/orders" className="panel-action">View all <ArrowUpRight size={15} /></Link></div>{recentOrders.length ? <ul className="summary-list order-list">{recentOrders.slice(0,5).map((order,index) => <li key={String(order.id ?? index)}><span className="order-list-icon"><ShoppingBag size={18} /></span><span>{typeof order.id === "string" ? <Link href={`/orders/${order.id}`}>{String(order.order_number ?? order.number ?? "Order")}</Link> : String(order.order_number ?? order.number ?? "Order")}<small>{String(order.customer_name ?? record(order.customer).name ?? "Customer order")}</small></span><StatusBadge value={String(order.status ?? "—")} /></li>)}</ul> : orderResult.error ? <p className="panel-empty" role="alert">{orderResult.error}</p> : <EmptyState compact title="Ready for your first order" description="Create an order to start tracking your sales and fulfillment." />}</section>
    <section className="panel compact-panel"><div className="panel-heading"><div><h2>On your radar</h2><p>Your upcoming follow-ups</p></div><Link href="/activities" className="panel-action"><ClipboardList size={16} /> Activities</Link></div>{followUps.length ? <ul className="summary-list">{followUps.slice(0,5).map((activity,index) => <li key={String(activity.id ?? index)}>{String(activity.subject ?? activity.title ?? "Follow-up")}</li>)}</ul> : reminderResult.error ? <p className="panel-empty" role="alert">{reminderResult.error}</p> : <EmptyState compact title="A little breathing room" description="No follow-ups due. Add an activity to plan your next move." />}{activityResult.rows.length > 0 && <p className="chart-note">{activityResult.rows.length} recent activities in your workspace</p>}</section></div>
    <Link href="/ai-assistant" className="dashboard-ai-banner"><span className="ai-banner-icon"><Sparkles size={23} /></span><div><strong>Your next business advantage is on its way.</strong><p>Discover what we’re building for your AI-powered workspace.</p></div><span className="ai-banner-cta">Meet your AI Assistant <ArrowUpRight size={17} /></span></Link>
  </div>;
}
