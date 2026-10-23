import { Suspense } from "react";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { moduleDetail, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";
import { record } from "@/lib/api";

export default function Page({ params }: { params: Promise<{ accountId: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="MONEY / ACCOUNT BOOK" title="Account activity" description="Loading transactions…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading account activity"><div /><div /><div /><div /></div></ModuleCard></div>}><AccountBook params={params} /></Suspense>;
}

async function AccountBook({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { data, error } = await moduleDetail(`/payment-accounts/${encodeURIComponent(accountId)}/book`);
  const rows = Array.isArray(data.rows) ? data.rows.map(record) : [];
  return <div className="module-page"><ModuleHeader eyebrow="MONEY / ACCOUNT BOOK" title={value(data, "account.name", "name")} description="Transactions and running balance" /><ModuleCard>{error ? <p role="alert">{error}</p> : <div className="module-table-scroll"><table className="module-table"><thead><tr><th>Date</th><th>Kind</th><th>Reference</th><th className="money-cell">In</th><th className="money-cell">Out</th><th className="money-cell">Balance</th></tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}><td>{formatDate(row.date)}</td><td>{value(row, "kind")}</td><td>{value(row, "reference")}</td><td className="money-cell">{formatPkr(Number(row.in_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(row.out_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(row.balance_paisa ?? 0))}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="module-state">No transactions in this period.</p>}</div>}</ModuleCard></div>;
}
