"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRefund, refundOrders } from "@/app/actions/new-modules";
import { ModuleCard } from "./module-ui";

type Option = { id: string; name: string };
const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash", "mobile_wallet", "cheque", "other"];

export function RefundCreateForm({ customers, accounts }: { customers: Option[]; accounts: Option[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createRefund, {});
  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState<Option[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [loadingOrders, startLoadingOrders] = useTransition();
  const request = useRef(0);
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => { if (state.destination) router.refresh(); }, [state.destination, router]);
  function selectCustomer(id: string) {
    setCustomerId(id); setOrders([]); setOrdersError("");
    const current = ++request.current;
    if (!id) return;
    startLoadingOrders(async () => { const result = await refundOrders(id); if (request.current !== current) return; setOrders(result.orders); setOrdersError(result.error ?? ""); });
  }
  return <ModuleCard><h2>Refund money</h2><p className="module-muted">Record a refund against a paid order or the customer’s available credit. The API checks the available amount.</p><form action={action} className="refund-form" onSubmit={event => { if (!window.confirm("Record this refund? This will affect the customer balance and selected payment account.")) event.preventDefault(); }}><input type="hidden" name="operation_key" value={key} /><div className="module-grid-two"><label className="module-field">Customer *<select name="customer_id" required value={customerId} onChange={event => selectCustomer(event.target.value)}><option value="">Choose customer</option>{customers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="module-field">Order, if applicable<select name="order_id" disabled={!customerId || loadingOrders}><option value="">Refund from customer credit</option>{orders.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{loadingOrders && <small>Loading customer orders…</small>}{ordersError && <small role="alert">{ordersError}</small>}</label><label className="module-field">Amount (PKR) *<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></label><label className="module-field">Method *<select name="method" required defaultValue=""><option value="">Choose method</option>{methods.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label className="module-field">Payment account<select name="payment_account_id" defaultValue=""><option value="">Unassigned</option>{accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="module-field">Reference<input name="reference" maxLength={120} placeholder="Bank or receipt reference" /></label></div><label className="module-field">Reason *<textarea name="reason" minLength={3} maxLength={300} required rows={3} dir="auto" placeholder="Why is this money being returned?" /></label>{state.error && <p role="alert" className="module-error">{state.error}</p>}{state.destination && <p role="status" className="module-success">Refund recorded.</p>}<button type="submit" className="module-primary" disabled={pending || !customerId || Boolean(state.destination)}>{pending ? "Recording…" : "Record refund"}</button></form></ModuleCard>;
}
