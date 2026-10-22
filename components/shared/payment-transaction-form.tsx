"use client";

import { useActionState, useRef, useState } from "react";
import { CalendarClock, CreditCard, RotateCcw } from "lucide-react";
import { runOperation, type OperationState } from "@/app/actions/operations";

type Customer = { id: string; name: string; detail: string };
type Order = { id: string; number: string; customerId: string; total: string };
const methods = [["cash", "Cash"], ["bank_transfer", "Bank transfer"], ["easypaisa", "EasyPaisa"], ["jazzcash", "JazzCash"], ["mobile_wallet", "Mobile wallet"], ["cheque", "Cheque"], ["other", "Other"]];

function toOffsetDateTime(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return "";
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return "";
  const offset = -date.getTimezoneOffset();
  const sign = offset < 0 ? "-" : "+";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${local}:00${sign}${hours}:${minutes}`;
}

export function PaymentTransactionForm({ mode, customers, orders, customerError, orderError, customersLimited, ordersLimited }: { mode: "payment" | "refund"; customers: Customer[]; orders: Order[]; customerError?: string; orderError?: string; customersLimited: boolean; ordersLimited: boolean }) {
  const refund = mode === "refund";
  const [customerId, setCustomerId] = useState("");
  const [receivedLocal, setReceivedLocal] = useState("");
  const [state, action, pending] = useActionState(runOperation.bind(null, refund ? "refund.create" : "payment.create", undefined), {} as OperationState);
  const keyRef = useRef<HTMLInputElement>(null);
  const timestampRef = useRef<HTMLInputElement>(null);
  const filteredOrders = orders.filter(order => !customerId || !order.customerId || order.customerId === customerId);
  const fields = <div className="payments-form-grid"><label><span>Customer *</span><select name="customer_id" value={customerId} onChange={event => setCustomerId(event.target.value)} required disabled={pending || customers.length === 0}><option value="">Choose a customer…</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.detail ? ` · ${customer.detail}` : ""}</option>)}</select><small>{customerError ? `Customers unavailable: ${customerError}` : customers.length === 0 ? "Add a customer to the directory first." : customersLimited ? "Some customers are not shown. Browse the directory for more." : "Select a name; its ID is sent automatically."}</small></label>
    <label><span>Order <em>optional</em></span><select key={customerId} name="order_id" defaultValue="" disabled={pending || Boolean(orderError)}><option value="">No linked order</option>{filteredOrders.map(order => <option key={order.id} value={order.id}>{order.number} · {order.total}</option>)}</select><small>{orderError ? `Orders unavailable: ${orderError}` : ordersLimited ? "Some orders are not shown." : "Orders for the chosen customer are shown when available."}</small></label>
    <label><span>Amount (PKR) *</span><div className="payments-money-input"><strong>Rs</strong><input name="amount_paisa" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required disabled={pending} /></div></label>
    <label><span>Method *</span><select name="method" defaultValue="" required disabled={pending}><option value="">Choose a method…</option>{methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label><span>Reference</span><input name="reference" placeholder="Receipt or transfer reference" disabled={pending} /></label>
    <label><span><CalendarClock size={14} /> Received at</span><input type="datetime-local" value={receivedLocal} onChange={event => setReceivedLocal(event.target.value)} disabled={pending} /><small>Choose local date and time; the UTC offset is added on submit.</small></label>
    {refund && <label className="payments-wide-field"><span>Reason *</span><textarea name="reason" rows={3} required placeholder="Why is this payment being refunded?" disabled={pending} /></label>}
  </div>;
  const form = <form action={action} className="payments-form" onSubmit={() => { if (timestampRef.current) timestampRef.current.value = receivedLocal ? toOffsetDateTime(receivedLocal) : ""; if (keyRef.current) keyRef.current.value = state.nextKey ?? (keyRef.current.value || crypto.randomUUID()); }}><input ref={timestampRef} name="received_at" type="hidden" /><input ref={keyRef} name="operation_key" type="hidden" />{fields}{refund && <label className="payments-confirm"><input type="checkbox" name="confirmation" value="yes" required /><span>I understand this refund will change business records.</span></label>}{state.error && <p className="payments-form-error" role="alert">{state.error}</p>}{state.success && <p className="payments-form-success" role="status">{refund ? "Refund saved." : "Payment recorded."}</p>}<div className="payments-form-footer"><span>Required fields are marked *</span><button type="submit" disabled={pending || customers.length === 0}>{refund ? <RotateCcw size={16} /> : <CreditCard size={16} />}{pending ? "Saving…" : refund ? "Refund money" : "Record payment"}</button></div></form>;
  if (refund) return <details className="payments-refund"><summary><span><RotateCcw size={18} /></span><div><strong>Refund money</strong><small>Return a payment with a clear record</small></div><b>+</b></summary>{form}</details>;
  return <section id="record-payment" className="payments-create"><div className="payments-create-heading"><span><CreditCard size={21} /></span><div><small>NEW COLLECTION</small><h2>Record a payment</h2><p>Connect money received to the right customer and order.</p></div></div>{form}</section>;
}
