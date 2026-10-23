import { Suspense } from "react";
import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { moduleList, value } from "@/lib/module-data";
import { formatPkr } from "@/lib/crm-format";

export default function Page() {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="MONEY / ACCOUNTS" title="Cash and bank" description="Loading account balances…" /><div className="module-list-skeleton" role="status" aria-label="Loading cash and bank"><div /><div /><div /><div /></div></div>}><CashBankContent /></Suspense>;
}

async function CashBankContent() {
  const result = await moduleList("/payment-accounts/balances");
  const total = result.rows.reduce((sum, row) => sum + Number(row.balance_paisa ?? 0), 0);
  return <div className="module-page"><ModuleHeader eyebrow="MONEY / ACCOUNTS" title="Cash and bank" description="See balances and activity across your payment accounts." /><nav className="module-actions" aria-label="Cash and bank views"><Link className="module-secondary" href="/cash-bank/transfers">Transfers</Link><Link className="module-secondary" href="/settings/payment-accounts">Manage accounts</Link></nav>{result.error ? <ModuleCard><p role="alert">{result.error}</p><Link href="/cash-bank">Retry</Link></ModuleCard> : <><ModuleCard><span className="module-muted">Total across accounts</span><h2 className="cash-total">{formatPkr(total)}</h2></ModuleCard><div className="account-grid">{result.rows.map(account => <Link className="module-card account-card" key={String(account.id)} href={`/cash-bank/${account.id}`}><span>{value(account, "type")}</span><h2>{value(account, "name")}</h2><p>{value(account, "masked_number")}</p><strong>{formatPkr(Number(account.balance_paisa ?? 0))}</strong>{Number(account.balance_paisa ?? 0) < 0 && <small>Overdrawn</small>}</Link>)}</div>{result.rows.length === 0 && <ModuleCard><div className="module-state">No payment accounts yet. <Link href="/settings/payment-accounts">Manage accounts</Link></div></ModuleCard>}</>}</div>;
}
