import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, BarChart3, Download, Package, ReceiptText, TrendingUp, Users, Wallet } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { SalesChart } from "@/components/shared/sales-chart";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const reports = [
  { title: "Sales summary", path: "/sales/summary", icon: BarChart3, group: "Sales" },
  { title: "Sales trends", path: "/sales/trends", icon: TrendingUp, group: "Sales" },
  { title: "Top customers", path: "/sales/by-customer", icon: Users, group: "Relationships" },
  { title: "Top products", path: "/sales/by-product", icon: Package, group: "Sales" },
  { title: "Inactive customers", path: "/sales/inactive-customers", icon: Users, group: "Relationships" },
  { title: "Collections", path: "/payments/summary", icon: Wallet, group: "Finance" },
  { title: "Expenses", path: "/expenses/summary", icon: ReceiptText, group: "Finance" },
  { title: "Stock valuation", path: "/inventory/valuation", icon: Package, group: "Inventory" },
];

function display(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return key.endsWith("_paisa") && typeof value === "number" ? formatPaisa(value) : String(value);
}
function titleize(key: string) { return key.replace(/_paisa$/, "").replaceAll("_", " "); }
function summaryEntries(data: Record<string, unknown>) {
  const groups = data.current ? [record(data.current), record(data.previous)] : [data];
  return groups.flatMap((group, index) => Object.entries(group).filter(([, value]) => typeof value === "number").map(([key, value]) => ({ key, value, label: `${data.current ? index === 0 ? "Current " : "Previous " : ""}${titleize(key)}` }))).slice(0, 8);
}
function rowLabel(row: Record<string, unknown>, index: number) {
  return String(row.name ?? row.customer_name ?? row.product_name ?? row.period_start ?? row.period ?? row.date ?? row.customer_id ?? row.product_id ?? `Item ${index + 1}`);
}
function rowValue(row: Record<string, unknown>) {
  for (const key of ["net_sales_paisa", "amount_paisa", "sales_paisa", "total_paisa", "gross_sales_paisa", "orders", "quantity"]) if (typeof row[key] === "number") return display(key, row[key]);
  return "—";
}
function metric(data: Record<string, unknown>, keys: string[]) {
  const current = record(data.current);
  for (const key of keys) {
    if (typeof current[key] === "number") return display(key, current[key]);
    if (typeof data[key] === "number") return display(key, data[key]);
  }
  return "—";
}

export default function ReportsPage() {
  return <Suspense fallback={<WorkspaceSkeleton title="Reports" />}><ReportContent /></Suspense>;
}

async function ReportContent() {
  const workspace = await getWorkspace("/reports");
  const results = await Promise.all(reports.map(async report => {
    try {
      const raw = workspace.organizationId ? await apiRequest(report.path, { token: workspace.token, organizationId: workspace.organizationId }) : null;
      return { ...report, data: unwrap(raw), rows: items(raw), error: "" };
    } catch (error) { return { ...report, data: {}, rows: [], error: error instanceof ApiError ? error.message : "Report unavailable." }; }
  }));
  const find = (path: string) => results.find(result => result.path === path);
  const sales = find("/sales/summary");
  const collections = find("/payments/summary");
  const expenses = find("/expenses/summary");
  const trends = find("/sales/trends");
  const points = trends?.rows.filter(row => typeof row.net_sales_paisa === "number").map((row, index) => ({ label: rowLabel(row, index), value: Number(row.net_sales_paisa) })) ?? [];
  const snapshot = [
    { label: "Net sales", value: metric(sales?.data ?? {}, ["net_sales_paisa", "total_sales_paisa", "sales_paisa"]), note: "Sales summary", icon: BarChart3, tone: "blue" },
    { label: "Orders", value: metric(sales?.data ?? {}, ["orders", "order_count", "total_orders"]), note: "Sales summary", icon: TrendingUp, tone: "violet" },
    { label: "Collected", value: metric(collections?.data ?? {}, ["net_collected_paisa", "total_collected_paisa", "amount_paisa"]), note: "Payments summary", icon: Wallet, tone: "teal" },
    { label: "Expenses", value: metric(expenses?.data ?? {}, ["expenses_paisa", "total_paisa", "amount_paisa"]), note: "Expense summary", icon: ReceiptText, tone: "orange" },
  ];
  return <div className="reports-page">
    <header className="reports-header"><div><div className="module-eyebrow">{String(workspace.organization?.name ?? "WORKSPACE")} / ANALYTICS</div><h1>Reports<span>.</span></h1><p>See the numbers behind your business, all in one place.</p></div><a className="reports-export-link" href="#report-exports"><Download size={16} /> Export data</a></header>
    {!workspace.organizationId && <div className="reports-notice">Select or create an organization to see your reports.</div>}
    <div className="reports-strip"><span><span className="reports-live-dot" /> Business performance</span><span>All monetary values in <strong>PKR</strong></span></div>
    <section className="reports-metrics" aria-label="Report highlights">{snapshot.map(({ icon: Icon, ...item }) => <article className="reports-metric" key={item.label}><div className="reports-metric-top"><span>{item.label}</span><span className={`reports-metric-icon ${item.tone}`}><Icon size={18} /></span></div><strong>{item.value}</strong><small>{item.value === "—" ? "Data unavailable" : item.note}</small></article>)}</section>
    <div className="reports-main-grid"><section className="reports-panel reports-trends"><div className="reports-panel-head"><div><span className="reports-kicker">PERFORMANCE</span><h2>Sales over time</h2><p>Net sales across reported periods</p></div><span className="reports-head-icon"><TrendingUp size={20} /></span></div>{trends?.error ? <p className="reports-message" role="alert">{trends.error}</p> : points.length ? <SalesChart points={points} /> : <p className="reports-message">Sales trends will appear when your business has recorded sales.</p>}</section><section className="reports-panel reports-spotlight"><span className="reports-kicker">AT A GLANCE</span><h2>Explore your performance</h2><p>Eight focused views cover sales, customers, payments, expenses, and stock.</p><div className="reports-spotlight-items"><div><BarChart3 size={18} /><span>Understand what is selling</span></div><div><Users size={18} /><span>See your key customers</span></div><div><Wallet size={18} /><span>Track money coming in</span></div></div><a href="#report-library">Browse report library <ArrowUpRight size={16} /></a></section></div>
    <section id="report-library" className="reports-library"><div className="reports-section-heading"><div><span className="reports-kicker">REPORT LIBRARY</span><h2>Every angle of your business</h2><p>Detailed views from your live workspace data.</p></div><span>{reports.length} reports</span></div><div className="reports-grid">{results.map(result => {
      const Icon = result.icon;
      const entries = summaryEntries(result.data);
      return <article className="reports-panel reports-card" key={result.path}><div className="reports-card-heading"><span className="reports-card-icon"><Icon size={19} /></span><span className="reports-card-group">{result.group}</span></div><h3>{result.title}</h3>{result.error ? <p className="reports-card-empty" role="alert">{result.error}</p> : result.rows.length ? <ul className="reports-list">{result.rows.slice(0, 5).map((row, index) => <li key={String(row.id ?? index)}><span>{rowLabel(row, index)}</span><strong>{rowValue(row)}</strong></li>)}</ul> : entries.length ? <dl className="reports-list">{entries.slice(0, 5).map(entry => <div key={`${entry.label}-${entry.key}`}><dt>{entry.label}</dt><dd>{display(entry.key, entry.value)}</dd></div>)}</dl> : <p className="reports-card-empty">{result.path === "/sales/inactive-customers" ? "No inactive customers found." : "No report data available yet."}</p>}</article>;
    })}</div></section>
    <section id="report-exports" className="reports-export-panel"><div><span className="reports-kicker">TAKE IT WITH YOU</span><h2>Export your data</h2><p>Download CSV files for further analysis or sharing.</p></div><div className="reports-export-actions">{["customers", "orders", "payments", "expenses"].map(kind => <Link key={kind} href={`/exports/${kind}`}><Download size={15} /> {kind.charAt(0).toUpperCase() + kind.slice(1)} CSV</Link>)}</div></section>
  </div>;
}
