import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { formatPkr } from "@/lib/crm-format";
import { moduleList, value } from "@/lib/module-data";

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const query = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date : undefined;
  const result = await moduleList("/payment-accounts/daily-summary", { date });
  return <div className="module-page"><ModuleHeader eyebrow="MONEY / DAILY CLOSE" title="Daily cash summary" description="Reconcile opening, incoming, outgoing, and closing balances for one business day." />
    <nav className="module-actions"><Link className="module-secondary" href="/cash-bank">Cash and bank</Link><Link className="module-secondary" href="/cash-bank/transfers">Transfers</Link></nav>
    <ModuleCard><form className="module-filter" action="/cash-bank/daily-summary"><label className="module-field">Business date<input type="date" name="date" defaultValue={date} /></label><button type="submit">View day</button></form></ModuleCard>
    <ModuleCard>{result.error ? <p role="alert">{result.error}</p> : result.rows.length ? <div className="module-table-scroll"><table className="module-table"><thead><tr><th>Account</th><th className="money-cell">Opening</th><th className="money-cell">In</th><th className="money-cell">Out</th><th className="money-cell">Closing</th></tr></thead><tbody>{result.rows.map((row, index) => <tr key={String(row.id ?? row.account_id ?? index)}><td>{value(row, "account.name", "name")}</td><td className="money-cell">{formatPkr(Number(row.opening_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(row.in_paisa ?? row.incoming_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(row.out_paisa ?? row.outgoing_paisa ?? 0))}</td><td className="money-cell">{formatPkr(Number(row.closing_paisa ?? row.balance_paisa ?? 0))}</td></tr>)}</tbody></table></div> : <p className="module-state">No cash movement was recorded for this day.</p>}</ModuleCard>
  </div>;
}
