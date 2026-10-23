"use client";

import { useActionState, useRef } from "react";
import { runOperation, type OperationState } from "@/app/actions/operations";
import { LineEditor } from "@/components/shared/line-editor";
import { operationById, type Field } from "@/lib/operations";

const initial: OperationState = {};
function defaultValue(field: Field, data: Record<string, unknown>) {
  const value = field.key === "expected_version" ? data.version : data[field.key];
  if (value === null || value === undefined) return "";
  if (field.kind === "tags" && Array.isArray(value)) return value.join(", ");
  if ((field.kind === "money" || field.kind === "signedMoney") && typeof value === "number") return (value / 100).toFixed(2);
  return String(value);
}

export function OperationForm({ operationId, entityId, defaults = {}, defaultOpen = false, selectOptions = {}, lineOptions }: { operationId: string; entityId?: string; defaults?: Record<string, unknown>; defaultOpen?: boolean; selectOptions?: Record<string, { value: string; label: string }[]>; lineOptions?: { value: string; label: string }[] }) {
  const operation = operationById(operationId);
  const [state, action, pending] = useActionState(runOperation.bind(null, operationId, entityId), initial);
  const keyInput = useRef<HTMLInputElement>(null);
  if (!operation) return null;
  return <details className="operation-panel" open={defaultOpen || undefined}><summary>{operation.label}</summary><form action={action} className="operation-form" onSubmit={() => {
    if (operation.idempotent && keyInput.current) keyInput.current.value = state.nextKey ?? (keyInput.current.value || crypto.randomUUID());
  }}>
    {operation.fields.map(field => {
      const id = `${operationId}-${field.key}`;
      if (field.kind === "lines") return <div className="operation-field" key={field.key}><span>{field.label} *</span><LineEditor operationId={operationId} productOptions={lineOptions} /></div>;
      if (field.key === "expected_version") return <input key={field.key} type="hidden" name={field.key} value={defaultValue(field,defaults)} />;
      const visibleLabel = operationId.startsWith("product.") && field.key === "price_paisa" ? "Selling price (PKR)" : operationId.startsWith("product.") && field.key === "cost_price_paisa" ? "Cost price (PKR)" : operationId.startsWith("product.") && field.key === "quantity_scale" ? "Quantity decimal places" : field.label;
      const helper = field.key === "price_paisa" || field.key === "cost_price_paisa" ? "Enter PKR. We’ll send the exact value as integer paisa." : field.key === "quantity_scale" && operationId.startsWith("product.") ? "Allowed range: 0–3 decimal places." : field.hint;
      return <label key={field.key} htmlFor={id}><span>{selectOptions[field.key] ? field.label.replace(/ ID$/, "") : visibleLabel}{field.required ? " *" : ""}</span>
        {selectOptions[field.key] ? <><select id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required} disabled={field.required && selectOptions[field.key].length === 0}><option value="">{operationId === "product.update" && field.key === "category_id" ? "No category" : `Choose ${field.label.replace(/ ID$/, "").toLowerCase()}…`}</option>{selectOptions[field.key].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{selectOptions[field.key].length === 0 && <small>No options are available. Add a record or refresh the page.</small>}</>
        : field.kind === "select" ? <select id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required}><option value="">Choose…</option>{field.options?.map(option => <option key={option} value={option}>{option.replaceAll("_"," ")}</option>)}</select>
        : field.kind === "textarea" ? <textarea id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required} rows={3} maxLength={field.max} />
        : field.kind === "checkbox" ? <input id={id} name={field.key} type="checkbox" defaultChecked={defaults[field.key] === true} />
        : <input id={id} name={field.key} type={field.kind === "password" ? "password" : field.kind === "email" ? "email" : field.kind === "date" ? "date" : field.kind === "money" || field.kind === "signedMoney" || field.kind === "integer" || field.kind === "nonnegativeInteger" || field.kind === "quantity" ? "number" : "text"} step={field.kind === "money" || field.kind === "signedMoney" ? "0.01" : field.kind === "quantity" ? "0.001" : field.kind === "integer" || field.kind === "nonnegativeInteger" ? "1" : undefined} min={field.kind === "money" || field.kind === "quantity" || field.kind === "nonnegativeInteger" ? 0 : undefined} max={field.kind === "nonnegativeInteger" ? field.max : undefined} maxLength={field.kind === "text" || field.kind === "uuid" || field.kind === "email" ? field.max : undefined} defaultValue={defaultValue(field,defaults)} required={field.required} placeholder={field.kind === "datetime" ? "2026-10-19T12:00:00+05:00" : field.kind === "uuid" ? "UUID" : undefined} />}
        {helper && <small>{helper}</small>}
      </label>;
    })}
    {operation.idempotent && <input ref={keyInput} type="hidden" name="operation_key" defaultValue="" />}
    {operation.dangerous && <label className="confirm-field"><input type="checkbox" name="confirmation" value="yes" required /><span>I understand this action may change business records.</span></label>}
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.success && <p role="status" className="form-success">{state.success}</p>}
    <button type="submit" disabled={pending || operation.fields.some(field => field.required && selectOptions[field.key]?.length === 0) || (["order.create", "inventory.adjust", "inventory.stocktake"].includes(operationId) && lineOptions?.length === 0)}>{pending ? "Saving…" : operation.label}</button>
  </form></details>;
}
