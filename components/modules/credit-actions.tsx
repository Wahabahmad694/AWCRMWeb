"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { applyCredit, voidCredit } from "@/app/actions/new-modules";
import { formatPkr } from "@/lib/crm-format";

type Order = { id: string; number: string; outstandingPaisa: number };
export function CreditActions({ id, remainingPaisa, orders, canVoid }: { id: string; remainingPaisa: number; orders: Order[]; canVoid: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [applyState, apply, applying] = useActionState(applyCredit, {});
  const [voidState, voidAction, voiding] = useActionState(voidCredit, {});
  const order = orders.find(item => item.id === selected);
  useEffect(() => { if (applyState.destination || voidState.destination) router.refresh(); }, [applyState.destination, voidState.destination, router]);
  return <div className="credit-actions"><details className="module-card"><summary>Apply to an order</summary><form action={apply}><input type="hidden" name="credit_id" value={id} /><input type="hidden" name="remaining" value={remainingPaisa} /><input type="hidden" name="outstanding" value={order?.outstandingPaisa ?? 0} /><label className="module-field">Order<select name="order_id" required value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose an order</option>{orders.map(item => <option key={item.id} value={item.id}>{item.number} · owes {formatPkr(item.outstandingPaisa)}</option>)}</select></label><label className="module-field">Amount (Rs)<input name="amount" inputMode="decimal" required defaultValue={order ? (Math.min(remainingPaisa, order.outstandingPaisa) / 100).toFixed(2) : ""} key={selected} /></label><p className="module-hint">Remaining credit: {formatPkr(remainingPaisa)}. Order owes: {formatPkr(order?.outstandingPaisa ?? 0)}.</p>{applyState.error && <p role="alert" className="module-error">{applyState.error}</p>}<button className="module-primary" disabled={applying || !order}>Apply credit</button></form></details>{canVoid && <details className="module-card"><summary>Void credit note</summary><form action={voidAction}><input type="hidden" name="credit_id" value={id} /><label className="module-field">Reason<textarea name="reason" dir="auto" required maxLength={1000} /></label>{voidState.error && <p role="alert" className="module-error">{voidState.error}</p>}<button className="module-danger" disabled={voiding} onClick={event => { if (!window.confirm("Void this credit note?")) event.preventDefault(); }}>Void credit note</button></form></details>}</div>;
}
