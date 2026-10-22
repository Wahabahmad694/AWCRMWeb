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
  if (field.kind === "money" && typeof value === "number") return (value / 100).toFixed(2);
  return String(value);
}

export function OperationForm({ operationId, entityId, defaults = {}, defaultOpen = false, selectOptions = {} }: { operationId: string; entityId?: string; defaults?: Record<string, unknown>; defaultOpen?: boolean; selectOptions?: Record<string, { value: string; label: string }[]> }) {
  const operation = operationById(operationId);
  const [state, action, pending] = useActionState(runOperation.bind(null, operationId, entityId), initial);
  const keyInput = useRef<HTMLInputElement>(null);
  if (!operation) return null;
  return <details className="operation-panel" open={defaultOpen || undefined}><summary>{operation.label}</summary><form action={action} className="operation-form" onSubmit={() => {
    if (operation.idempotent && keyInput.current) keyInput.current.value = state.nextKey ?? (keyInput.current.value || crypto.randomUUID());
  }}>
    {operation.fields.map(field => {
      const id = `${operationId}-${field.key}`;
      if (field.kind === "lines") return <div className="operation-field" key={field.key}><span>{field.label} *</span><LineEditor operationId={operationId} /></div>;
      if (field.key === "expected_version") return <input key={field.key} type="hidden" name={field.key} value={defaultValue(field,defaults)} />;
      return <label key={field.key} htmlFor={id}><span>{selectOptions[field.key] ? field.label.replace(/ ID$/, "") : field.label}{field.required ? " *" : ""}</span>
        {selectOptions[field.key] ? <><select id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required}><option value="">Choose a category…</option>{selectOptions[field.key].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{selectOptions[field.key].length === 0 && <small>Create an expense category first, then choose it here.</small>}</>
        : field.kind === "select" ? <select id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required}><option value="">Choose…</option>{field.options?.map(option => <option key={option} value={option}>{option.replaceAll("_"," ")}</option>)}</select>
        : field.kind === "textarea" ? <textarea id={id} name={field.key} defaultValue={defaultValue(field,defaults)} required={field.required} rows={3} />
        : field.kind === "checkbox" ? <input id={id} name={field.key} type="checkbox" defaultChecked={defaults[field.key] === true} />
        : <input id={id} name={field.key} type={field.kind === "password" ? "password" : field.kind === "email" ? "email" : field.kind === "date" ? "date" : field.kind === "money" || field.kind === "integer" || field.kind === "nonnegativeInteger" || field.kind === "quantity" ? "number" : "text"} step={field.kind === "money" ? "0.01" : field.kind === "quantity" ? "0.001" : field.kind === "integer" || field.kind === "nonnegativeInteger" ? "1" : undefined} min={field.kind === "money" || field.kind === "quantity" || field.kind === "nonnegativeInteger" ? 0 : undefined} defaultValue={defaultValue(field,defaults)} required={field.required} placeholder={field.kind === "datetime" ? "2026-10-19T12:00:00+05:00" : field.kind === "uuid" ? "UUID" : undefined} />}
        {field.hint && <small>{field.hint}</small>}
      </label>;
    })}
    {operation.idempotent && <input ref={keyInput} type="hidden" name="operation_key" defaultValue="" />}
    {operation.dangerous && <label className="confirm-field"><input type="checkbox" name="confirmation" value="yes" required /><span>I understand this action may change business records.</span></label>}
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.success && <p role="status" className="form-success">{state.success}</p>}
    <button type="submit" disabled={pending}>{pending ? "Saving…" : operation.label}</button>
  </form></details>;
}
