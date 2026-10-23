import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { apiRequest, getWorkspace, record, unwrap, ApiError } from "@/lib/api";
import { formatDate, formatPkr, karachiToday } from "@/lib/crm-format";

function range(preset: string, today: string): { from: string; to: string } {
  const date = new Date(`${today}T12:00:00Z`);
  const to = today;
  if (preset === "month") return { from: `${today.slice(0, 7)}-01`, to };
  if (preset === "last-month") { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - 1); const from = date.toISOString().slice(0, 10); date.setUTCMonth(date.getUTCMonth() + 1); date.setUTCDate(0); return { from, to: date.toISOString().slice(0, 10) }; }
  if (preset === "three-months") { date.setUTCMonth(date.getUTCMonth() - 3); return { from: date.toISOString().slice(0, 10), to }; }
  const year = Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 7 ? 1 : 0);
  return { from: `${year}-07-01`, to };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preset?: string; from?: string; to?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const preset = query.preset ?? "fiscal";
  const dates = query.from && query.to ? { from: query.from, to: query.to } : range(preset, karachiToday());
  const days = (new Date(`${dates.to}T12:00:00Z`).getTime() - new Date(`${dates.from}T12:00:00Z`).getTime()) / 86400000;
  const invalid = !/^\d{4}-\d{2}-\d{2}$/.test(dates.from) || !/^\d{4}-\d{2}-\d{2}$/.test(dates.to) || days < 0 || days > 366;
  let data: Record<string, unknown> = {};
  let error = invalid ? "Choose a period of one year or less." : "";
  if (!invalid) {
    const workspace = await getWorkspace(`/customers/${id}/statement`);
    try { if (workspace.organizationId) data = unwrap(await apiRequest(`/customers/${encodeURIComponent(id)}/statement`, { token: workspace.token, organizationId: workspace.organizationId, query: dates })); else error = "Select an organization first."; }
    catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "You do not have permission to view this statement." : cause instanceof Error ? cause.message : "Unable to load statement."; }
  }
  const entries = Array.isArray(data.rows) ? data.rows.map(record) : [];
  const summary = record(data.summary ?? data);
  const name = String(record(data.customer).name ?? "Customer");
  return <div className="module-page statement-print"><ModuleHeader eyebrow="CUSTOMERS / STATEMENT" title={`${name} statement`} description={`${formatDate(dates.from)} – ${formatDate(dates.to)}`} /><div className="statement-controls"><nav className="module-chips" aria-label="Statement period">{[["fiscal", "This fiscal year"], ["month", "This month"], ["last-month", "Last month"], ["three-months", "Last 3 months"]].map(([key, label]) => <Link key={key} className={preset === key && !query.from ? "active" : ""} href={`?preset=${key}`}>{label}</Link>)}</nav><form action="" className="module-filter"><label>From <input type="date" name="from" defaultValue={dates.from} /></label><label>To <input type="date" name="to" defaultValue={dates.to} /></label><button type="submit">Apply</button></form></div>{error ? <ModuleCard><p role="alert">{error}</p><Link href={`/customers/${id}/statement`}>Retry</Link></ModuleCard> : <><div className="statement-summary">{[["Opening balance", "opening_balance_paisa"], ["Total debits", "total_debits_paisa"], ["Total credits", "total_credits_paisa"], ["Closing balance", "closing_balance_paisa"]].map(([label, key]) => <ModuleCard key={key}><span>{label}</span><strong>{formatPkr(Number(summary[key] ?? 0))}</strong></ModuleCard>)}</div><ModuleCard><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th className="money-cell">Debit</th><th className="money-cell">Credit</th><th className="money-cell">Balance</th></tr></thead><tbody><tr><td>{formatDate(dates.from)}</td><td>Opening</td><td>—</td><td>Opening balance</td><td></td><td></td><td className="money-cell">{formatPkr(Number(summary.opening_balance_paisa ?? 0))}</td></tr>{entries.map((entry, index) => <tr key={String(entry.id ?? index)}><td>{formatDate(entry.date)}</td><td>{String(entry.type ?? "—")}</td><td>{String(entry.reference ?? "—")}</td><td>{String(entry.description ?? "—")}</td><td className="money-cell">{formatPkr(Number(entry.debit_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(entry.credit_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(entry.balance_paisa ?? 0))}</td></tr>)}<tr><td>{formatDate(dates.to)}</td><td>Closing</td><td>—</td><td>Closing balance</td><td></td><td></td><td className="money-cell"><strong>{formatPkr(Number(summary.closing_balance_paisa ?? 0))}</strong></td></tr></tbody></table></div>{entries.length === 0 && <p className="module-state">No transactions in this period.</p>}</ModuleCard><div className="module-actions"><a className="module-secondary" href={`/customers/${id}/statement/print?from=${dates.from}&to=${dates.to}`} target="_blank" rel="noopener">Print</a><a className="module-secondary" href={`/customers/${id}/statement.csv?from=${dates.from}&to=${dates.to}`}>Download CSV</a></div></>}</div>;
}
