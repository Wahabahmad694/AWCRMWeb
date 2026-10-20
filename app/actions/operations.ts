"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiRequest, getWorkspace } from "@/lib/api";
import { operationById, type Field } from "@/lib/operations";

export type OperationState = { error?: string; success?: string; nextKey?: string };
const uuid = z.uuid();
const decimal = /^-?\d+(?:\.\d{1,3})?$/;
const positiveDecimal = /^\d+(?:\.\d{1,3})?$/;

function parseMoney(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [rupees, paisa = ""] = value.split(".");
  const total = Number(rupees) * 100 + Number(paisa.padEnd(2, "0"));
  return Number.isSafeInteger(total) && total <= 100000000000000 ? total : null;
}

function parseField(field: Field, form: FormData, operationId: string): { value?: unknown; error?: string } {
  if (field.kind === "checkbox") return { value: form.get(field.key) === "on" };
  const raw = form.get(field.key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return field.required ? { error: `${field.label} is required.` } : {};
  if (field.options && !field.options.includes(value)) return { error: `Choose a valid ${field.label.toLowerCase()}.` };
  if (field.kind === "uuid" && !uuid.safeParse(value).success) return { error: `${field.label} must be a valid ID.` };
  if (field.kind === "email" && !z.email().safeParse(value).success) return { error: `${field.label} must be a valid email.` };
  if (field.kind === "money") {
    const amount = parseMoney(value);
    if (amount === null || (amount === 0 && ["payment.create","refund.create","expense.create"].includes(operationId))) return { error: `Enter a valid ${field.label.toLowerCase()}.` };
    return { value: amount };
  }
  if (field.kind === "integer") {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1) return { error: `${field.label} must be a positive whole number.` };
    return { value: number };
  }
  if (field.kind === "nonnegativeInteger") { const number = Number(value); if (!Number.isSafeInteger(number) || number < 0) return { error: `${field.label} must be a nonnegative whole number.` }; return { value:number }; }
  if (field.kind === "tags") { const tags = value.split(",").map(tag => tag.trim()).filter(Boolean); if (tags.length > 20 || tags.some(tag => tag.length > 40)) return { error:"Enter up to 20 tags, each at most 40 characters." }; return { value:tags }; }
  if (field.kind === "quantity" && !positiveDecimal.test(value)) return { error: `${field.label} must be a nonnegative decimal.` };
  if (field.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { error: `${field.label} must be a date.` };
  if (field.kind === "datetime" && !z.iso.datetime({ offset: true }).safeParse(value).success) return { error: `${field.label} must include a UTC offset, such as 2026-10-19T12:00:00+05:00.` };
  if (field.kind === "lines") {
    let parsed: unknown;
    try { parsed = JSON.parse(value); } catch { return { error: "Line items must be valid JSON." }; }
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 500) return { error: "Enter between 1 and 500 line items." };
    return { value: parsed };
  }
  return { value };
}

function validateLines(id: string, value: unknown): string | undefined {
  if (!Array.isArray(value)) return;
  const requiredId = id === "order.return" ? "order_item_id" : "product_id";
  const quantityKey = id === "inventory.adjust" ? "quantity_change" : id === "inventory.stocktake" ? "counted_quantity" : "quantity";
  const max = id === "inventory.stocktake" ? 500 : id === "inventory.adjust" ? 100 : 200;
  if (value.length > max) return `Too many line items (maximum ${max}).`;
  for (const item of value) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return "Each line item must be an object.";
    const line = item as Record<string, unknown>;
    if (!uuid.safeParse(line[requiredId]).success) return `Each line item needs a valid ${requiredId}.`;
    const quantity = line[quantityKey];
    const text = typeof quantity === "number" ? String(quantity) : quantity;
    if (typeof text !== "string" || !(id === "inventory.adjust" ? decimal : positiveDecimal).test(text) || (Number(text) === 0 && id !== "inventory.stocktake")) return `Each line item needs a valid ${quantityKey}.`;
    const allowed = id === "order.create" ? [requiredId,quantityKey,"unit_price_paisa"] : [requiredId,quantityKey];
    if (Object.keys(line).some(key => !allowed.includes(key))) return "A line item contains an unsupported field.";
    if (line.unit_price_paisa !== undefined && (!Number.isSafeInteger(line.unit_price_paisa) || Number(line.unit_price_paisa) < 0)) return "Unit price must be nonnegative integer paisa.";
  }
}

export async function runOperation(operationId: string, entityId: string | undefined, _state: OperationState, form: FormData): Promise<OperationState> {
  const operation = operationById(operationId);
  if (!operation) return { error: "Unknown action." };
  const workspace = await getWorkspace();
  if (operation.organization !== false && !workspace.organizationId) return { error: "Select an organization first." };
  if (operation.path.includes("{id}") && (!entityId || !uuid.safeParse(entityId).success)) return { error: "Invalid record ID." };
  if (operation.dangerous && form.get("confirmation") !== "yes") return { error: "Confirm this action before submitting." };
  const body: Record<string, unknown> = {};
  for (const field of operation.fields) {
    const result = parseField(field, form, operationId);
    if (result.error) return { error: result.error };
    if (result.value !== undefined) body[field.key] = result.value;
  }
  if (operationId === "organization.create" && !body.currency) body.currency = "PKR";
  if (operationId === "organization.create" && !body.timezone) body.timezone = "Asia/Karachi";
  if (operationId === "target.create" && !body.month) return { error: "Month is required for this target." };
  if (operationId === "team.invite" && !body.email && !body.phone) return { error: "Enter an email or phone number." };
  if (operationId === "customer.create" && typeof body.name === "string" && body.name.length > 160) return { error: "Customer name is too long." };
  if (operationId === "product.create" && typeof body.name === "string" && body.name.length > 160) return { error: "Product name is too long." };
  if (body.lines) { const error = validateLines(operationId, body.lines); if (error) return { error }; }
  if (operation.method === "PATCH" && operation.fields.length && !Object.keys(body).some(key => key !== "expected_version")) return { error: "Change at least one field." };
  const key = form.get("operation_key");
  if (operation.idempotent && (typeof key !== "string" || !uuid.safeParse(key).success)) return { error: "Reload the form and try again." };
  const path = operation.path.replace("{organizationId}", workspace.organizationId ?? "").replace("{id}", entityId ?? "");
  try {
    await apiRequest(path, { method: operation.method, token: workspace.token, organizationId: operation.organization === false ? undefined : workspace.organizationId, body: operation.method === "DELETE" || operation.fields.length === 0 ? undefined : body, idempotencyKey: operation.idempotent ? String(key) : undefined });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.status === 409 && error.code === "version_conflict" ? "This record changed since you opened it. Refresh and try again." : error.message };
    return { error: "Unable to complete the action." };
  }
  for (const path of operation.refresh) revalidatePath(path);
  return { success: `${operation.label} completed.`, nextKey: operation.idempotent ? crypto.randomUUID() : undefined };
}
