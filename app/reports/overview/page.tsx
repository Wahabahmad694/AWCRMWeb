import Link from "next/link";
import { Suspense } from "react";
import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

const reports = [
  { title: "Sales summary", path: "/sales/summary" },
  { title: "Sales trends", path: "/sales/trends" },
  { title: "Top customers", path: "/sales/by-customer" },
  { title: "Top products", path: "/sales/by-product" },
  { title: "Inactive customers", path: "/sales/inactive-customers" },
  { title: "Collections", path: "/payments/summary" },
  { title: "Expenses", path: "/expenses/summary" },
  { title: "Stock valuation", path: "/inventory/valuation" },
];

function display(key: string, value: unknown) {
  return key.endsWith("_paisa") && typeof value === "number" ? formatPaisa(value) : String(value ?? "—");
}

function summaryEntries(data: Record<string, unknown>) {
  const groups = data.current ? [record(data.current), record(data.previous)] : [data];
  return groups.flatMap((group, index) => Object.entries(group).filter(([,value]) => typeof value === "number").map(([key,value]) => ({ key, value, label: `${data.current ? index === 0 ? "Current " : "Previous " : ""}${key.replace(/_paisa$/, "").replaceAll("_", " ")}` }))).slice(0,10);
}

function rowLabel(row: Record<string, unknown>, index: number) {
  return String(row.name ?? row.customer_name ?? row.product_name ?? row.period_start ?? row.period ?? row.date ?? row.customer_id ?? row.product_id ?? `Item ${index + 1}`);
}

function rowValue(row: Record<string, unknown>) {
  for (const key of ["net_sales_paisa", "amount_paisa", "sales_paisa", "total_paisa", "gross_sales_paisa", "orders", "quantity"]) {
    if (typeof row[key] === "number") return display(key,row[key]);
  }
  return "—";
}

export default function Page() {
  return <Suspense fallback={<div className="page-wrap" aria-busy="true"><div className="page-heading"><div><div className="eyebrow">ANALYTICS</div><h1>Reports</h1><p>Business performance from the API.</p></div></div><section className="panel resource-state" role="status">Loading reports…</section></div>}><ReportContent /></Suspense>;
}

async function ReportContent() {
  const workspace = await getWorkspace("/reports/overview");
  const results = await Promise.all(reports.map(async report => {
    try { const raw = workspace.organizationId ? await apiRequest(report.path, { token: workspace.token, organizationId: workspace.organizationId }) : null; return { ...report, data: unwrap(raw), rows: items(raw), error: "" }; }
    catch (error) { return { ...report, data: {}, rows: [], error: error instanceof ApiError ? error.message : "Unavailable" }; }
  }));
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">ANALYTICS</div><h1>Reports</h1><p>Business performance from the API.</p></div></div><div className="export-links">{["customers","orders","payments","expenses"].map(kind => <Link key={kind} href={`/exports/${kind}`}>Export {kind} CSV</Link>)}</div><div className="report-grid">{results.map(result => {
    const entries = summaryEntries(result.data);
    return <section className="panel report-card" key={result.path}><h2>{result.title}</h2>{result.error ? <p role="alert">{result.error}</p> : result.rows.length ? <ul className="summary-list">{result.rows.slice(0,8).map((row,index) => <li key={String(row.id ?? index)}><span>{rowLabel(row,index)}</span><strong>{rowValue(row)}</strong></li>)}</ul> : result.path === "/sales/inactive-customers" ? <p>No inactive customers found.</p> : entries.length ? <dl>{entries.map(entry => <div key={`${entry.label}-${entry.key}`}><dt>{entry.label}</dt><dd>{display(entry.key,entry.value)}</dd></div>)}</dl> : <p>No report data available.</p>}</section>;
  })}</div></div>;
}
