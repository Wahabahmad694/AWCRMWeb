"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarDays, CreditCard, FileText, FolderOpen, Plus, ReceiptText } from "lucide-react";
import { runOperation, type OperationState } from "@/app/actions/operations";

const methods = [
  ["cash", "Cash"], ["bank_transfer", "Bank transfer"], ["easypaisa", "EasyPaisa"],
  ["jazzcash", "JazzCash"], ["mobile_wallet", "Mobile wallet"], ["cheque", "Cheque"], ["other", "Other"],
];

export function ExpenseCreateForm({ categories, accounts, categoryError }: { categories: { id: string; name: string }[]; accounts: { id: string; name: string; type: string }[]; categoryError?: string }) {
  const [state, action, pending] = useActionState(runOperation.bind(null, "expense.create", undefined), {} as OperationState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
  return <section id="add-expense" className="expense-create-card"><div className="expense-create-head"><span><ReceiptText size={21} /></span><div><small>NEW EXPENSE</small><h2>Record an expense</h2><p>Keep business spending accurate and easy to review.</p></div></div>
    <form ref={formRef} action={action} className="expense-create-form"><div className="expense-form-grid"><label><span><FolderOpen size={14} /> Category *</span><select name="category_id" required defaultValue="" disabled={pending || categories.length === 0}><option value="">Choose a category…</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><small>{categoryError ? "Categories could not be loaded. Try refreshing the page." : categories.length === 0 ? "Create a category first, then refresh this page." : "The selected category is saved with this expense."}</small></label>
    <label><span>Amount (PKR) *</span><div className="expense-amount-input"><strong>Rs</strong><input name="amount_paisa" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required disabled={pending} /></div><small>Enter the amount in rupees.</small></label>
    <label><span><CalendarDays size={14} /> Expense date *</span><input name="expense_date" type="date" required disabled={pending} /><small>When the expense was incurred.</small></label>
    <label><span><CreditCard size={14} /> Payment method *</span><select name="method" required defaultValue="" disabled={pending}><option value="">Choose a method…</option>{methods.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><small>How this expense was paid.</small></label>
    {accounts.length > 0 && <label><span>Payment account</span><select name="paid_from_account_id" defaultValue={accounts.find(account => account.type === "cash")?.id ?? accounts[0].id} disabled={pending}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
    <label className="expense-wide-field"><span><FileText size={14} /> Description</span><textarea name="description" rows={3} placeholder="What was this expense for?" disabled={pending} /></label>
    <label className="expense-wide-field"><span>Receipt reference</span><input name="receipt_reference" type="text" placeholder="Invoice number or reference (optional)" disabled={pending} /></label></div>
    {state.error && <p role="alert" className="expense-form-error">{state.error}</p>}{state.success && <p role="status" className="expense-form-success">Expense saved. You can add another below.</p>}
    <div className="expense-form-footer"><span>Required fields are marked *</span><button type="submit" disabled={pending || categories.length === 0}><Plus size={17} /> {pending ? "Saving expense…" : "Add expense"}</button></div></form>
  </section>;
}
