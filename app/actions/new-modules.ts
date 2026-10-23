"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { pkrToPaisa } from "@/lib/crm-format";

export type ModuleActionState = { error?: string; field?: string; destination?: string };
const id = z.uuid();
const date = /^\d{4}-\d{2}-\d{2}$/;

function errorText(error: unknown) {
  if (!(error instanceof ApiError)) return "Unable to save. Please retry.";
  const messages: Record<string, string> = {
    version_conflict: "This record was changed by someone else. Reload and try again.",
    permission_denied: "You do not have permission to do this.",
    duplicate_phone: "A lead or customer with this phone number already exists.",
    quotation_not_editable: "Only draft quotations can be edited.",
    quotation_expired: "This quotation has expired. Duplicate it to send a new one.",
    lost_reason_required: "Please say why the lead was lost.",
    refund_exceeds_paid: "The customer has paid less than this refund. Use a credit note instead.",
    credit_exceeds_remaining: "The amount is more than the credit left.",
    unknown_placeholder: "This message contains a placeholder that is not allowed for its context.",
    invalid_transition: "That status change is not allowed now.",
    lead_must_be_customer: "Convert this lead to a customer first.",
  };
  return messages[error.code] ?? error.message;
}

export async function saveQuotation(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const partyKind = form.get("party_kind");
  const partyId = String(form.get("party_id") ?? "");
  const issueDate = String(form.get("issue_date") ?? "");
  const validUntil = String(form.get("valid_until") ?? "");
  if (partyKind !== "customer" && partyKind !== "lead") return { field: "party_kind", error: "Choose a customer or lead." };
  if (!id.safeParse(partyId).success) return { field: "party_id", error: "Choose a party." };
  if (!date.test(issueDate) || !date.test(validUntil) || validUntil < issueDate) return { field: "valid_until", error: "Valid until must be on or after the issue date." };
  let lines: unknown;
  try { lines = JSON.parse(String(form.get("lines") ?? "")); } catch { return { field: "lines", error: "Add at least one valid item." }; }
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 200 || lines.some(line => { const entry = record(line); return typeof entry.description !== "string" || !entry.description.trim() || !/^\d+(?:\.\d{1,3})?$/.test(String(entry.quantity ?? "")) || Number(entry.quantity) <= 0 || !Number.isSafeInteger(entry.unit_price_paisa) || Number(entry.unit_price_paisa) < 0; })) return { field: "lines", error: "Enter 1 to 200 items with description, quantity and price." };
  const subtotal = lines.reduce((sum, line) => sum + Math.round(Number(record(line).quantity) * Number(record(line).unit_price_paisa)), 0);
  const discount = pkrToPaisa(String(form.get("discount") ?? "0"));
  const tax = pkrToPaisa(String(form.get("tax") ?? "0"));
  if (discount === null || discount > subtotal) return { field: "discount", error: "Discount cannot exceed subtotal." };
  if (tax === null) return { field: "tax", error: "Enter a valid tax amount." };
  const notes = String(form.get("notes") ?? "");
  const terms = String(form.get("terms") ?? "");
  if (notes.length > 1000 || terms.length > 2000) return { error: "Notes or terms are too long." };
  const key = String(form.get("operation_key") ?? "");
  const quotationId = String(form.get("quotation_id") ?? "");
  const version = Number(form.get("expected_version") ?? 0);
  if (!id.safeParse(key).success || (quotationId && (!id.safeParse(quotationId).success || !Number.isSafeInteger(version)))) return { error: "Reload the form and retry." };
  const workspace = await getWorkspace(quotationId ? `/quotations/${quotationId}/edit` : "/quotations/new");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const response = await apiRequest(quotationId ? `/quotations/${quotationId}` : "/quotations", { method: quotationId ? "PATCH" : "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: key, body: { ...(quotationId ? { expected_version: version } : {}), [`${partyKind}_id`]: partyId, issue_date: issueDate, valid_until: validUntil, lines, discount_paisa: discount, tax_paisa: tax, notes, terms } });
    const saved = unwrap(response);
    const savedId = String(saved.id ?? quotationId ?? "");
    if (form.get("send") === "yes" && id.safeParse(savedId).success) {
      await apiRequest(`/quotations/${savedId}/send`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: crypto.randomUUID(), body: { expected_version: saved.version } });
    }
    revalidatePath("/quotations");
    return { destination: id.safeParse(savedId).success ? `/quotations/${savedId}` : "/quotations" };
  } catch (error) { return { error: errorText(error) }; }
}

export async function saveLead(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 200) return { field: "name", error: "Enter a name of at most 200 characters." };
  const leadId = String(form.get("lead_id") ?? "");
  const version = Number(form.get("expected_version") ?? 0);
  if (leadId && (!id.safeParse(leadId).success || !Number.isSafeInteger(version) || version < 1)) return { error: "Reload the lead and retry." };
  const key = String(form.get("operation_key") ?? "");
  if (!id.safeParse(key).success) return { error: "Reload the form and retry." };
  const amountText = String(form.get("expected_value") ?? "").trim();
  const amount = amountText ? pkrToPaisa(amountText) : null;
  if (amountText && amount === null) return { field: "expected_value", error: "Enter a valid expected value." };
  const stage = String(form.get("stage_id") ?? "");
  if (stage && !id.safeParse(stage).success) return { field: "stage_id", error: "Choose a valid stage." };
  const workspace = await getWorkspace(leadId ? `/leads/${leadId}/edit` : "/leads/new");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  const body: Record<string, unknown> = { name };
  for (const field of ["company", "phone", "email", "source", "notes", "next_follow_up_date"]) {
    const value = String(form.get(field) ?? "").trim();
    if (value || leadId) body[field] = value || null;
  }
  if (stage && !leadId) body.stage_id = stage;
  if (amount !== null || leadId) body.expected_value_paisa = amount ?? 0;
  if (leadId) body.expected_version = version;
  body.whatsapp_opt_out = form.get("whatsapp_opt_out") === "on";
  try {
    const saved = unwrap(await apiRequest(leadId ? `/leads/${leadId}` : "/leads", { method: leadId ? "PATCH" : "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: leadId ? undefined : key, query: form.get("allow_duplicate") === "on" ? { allow_duplicate: "true" } : undefined, body }));
    revalidatePath("/leads");
    if (leadId) revalidatePath(`/leads/${leadId}`);
    return { destination: id.safeParse(saved.id).success ? `/leads/${saved.id}` : leadId ? `/leads/${leadId}` : "/leads" };
  } catch (error) { return { error: errorText(error) }; }
}

export async function transitionQuotation(quotationId: string, operation: string, version: number, reason?: string): Promise<{ error?: string; destination?: string }> {
  if (!id.safeParse(quotationId).success || !["send", "accept", "reject", "convert", "duplicate", "delete"].includes(operation)) return { error: "Invalid action." };
  const workspace = await getWorkspace(`/quotations/${quotationId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const response = await apiRequest(`/quotations/${quotationId}${operation === "delete" ? "" : `/${operation}`}`, { method: operation === "delete" ? "DELETE" : "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: operation === "convert" ? crypto.randomUUID() : undefined, body: ["delete", "duplicate"].includes(operation) ? undefined : { expected_version: version, ...(reason ? { reason } : {}) } });
    revalidatePath(`/quotations/${quotationId}`);
    revalidatePath("/quotations");
    const saved = unwrap(response);
    if (operation === "convert" && (saved.order_id || saved.id)) return { destination: `/orders/${saved.order_id ?? saved.id}` };
    if (operation === "duplicate" && saved.id) return { destination: `/quotations/${saved.id}` };
    if (operation === "delete") return { destination: "/quotations" };
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function createReturn(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const orderId = String(form.get("order_id") ?? "");
  if (!id.safeParse(orderId).success) return { field: "order_id", error: "Choose a fulfilled order." };
  const reason = String(form.get("reason") ?? "");
  if (!["damaged", "wrong_item", "quality", "changed_mind", "other"].includes(reason)) return { field: "reason", error: "Choose a return reason." };
  const note = String(form.get("note") ?? "").trim();
  if (reason === "other" && !note) return { field: "note", error: "Explain the return reason." };
  const resolution = String(form.get("resolution") ?? "");
  if (resolution !== "credit_note" && resolution !== "refund") return { field: "resolution", error: "Choose a resolution." };
  const method = String(form.get("method") ?? "");
  const paymentAccountId = String(form.get("payment_account_id") ?? "");
  if (resolution === "refund" && !method) return { field: "method", error: "Choose a refund method." };
  if (paymentAccountId && !id.safeParse(paymentAccountId).success) return { field: "payment_account_id", error: "Choose a valid account." };
  let lines: unknown;
  try { lines = JSON.parse(String(form.get("lines") ?? "")); } catch { return { field: "lines", error: "Choose at least one item." }; }
  if (!Array.isArray(lines) || !lines.length || lines.some(line => !id.safeParse(record(line).order_item_id).success || !/^\d+(?:\.\d{1,3})?$/.test(String(record(line).quantity ?? "")) || Number(record(line).quantity) <= 0)) return { field: "lines", error: "Choose valid quantities for the returned items." };
  const key = String(form.get("operation_key") ?? "");
  if (!id.safeParse(key).success) return { error: "Reload and try again." };
  const workspace = await getWorkspace("/returns/new");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const returnableResponse = unwrap(await apiRequest(`/orders/${orderId}/returnable`, { token: workspace.token, organizationId: workspace.organizationId }));
    const available = Array.isArray(returnableResponse.lines) ? returnableResponse.lines.map(record) : Array.isArray(returnableResponse.items) ? returnableResponse.items.map(record) : [];
    if (lines.some(line => { const entry = record(line); const original = available.find(candidate => String(candidate.order_item_id ?? candidate.id) === entry.order_item_id); return !original || Number(entry.quantity) > Number(original.returnable_quantity ?? 0); })) return { field: "lines", error: "A return quantity exceeds the amount available on this order. Reload and review." };
    const saved = unwrap(await apiRequest("/returns", { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: key, body: { order_id: orderId, lines, reason, note, restock: form.get("restock") === "on", resolution, apply_to_order: form.get("apply_to_order") === "on", ...(resolution === "refund" ? { method, ...(paymentAccountId ? { payment_account_id: paymentAccountId } : {}) } : {}) } }));
    revalidatePath("/returns");
    return { destination: id.safeParse(saved.id).success ? `/returns/${saved.id}` : "/returns" };
  } catch (error) { return { error: errorText(error) }; }
}

export async function transitionReturn(returnId: string, operation: "complete" | "cancel", version: number): Promise<{ error?: string }> {
  if (!id.safeParse(returnId).success || !Number.isSafeInteger(version)) return { error: "Invalid return." };
  const workspace = await getWorkspace(`/returns/${returnId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/returns/${returnId}/${operation}`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: crypto.randomUUID(), body: { expected_version: version } });
    revalidatePath(`/returns/${returnId}`); revalidatePath("/returns"); revalidatePath("/inventory");
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function renderFollowup(input: { targetType: "customer" | "lead"; targetId: string; context: string; templateId: string; relatedId?: string }): Promise<{ text?: string; phone?: string; error?: string }> {
  if (!id.safeParse(input.targetId).success || !id.safeParse(input.templateId).success) return { error: "Choose a valid contact and template." };
  const workspace = await getWorkspace("/activities");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const rendered = unwrap(await apiRequest("/followups/render", { method: "POST", token: workspace.token, organizationId: workspace.organizationId, body: { [`${input.targetType}_id`]: input.targetId, template_id: input.templateId, ...(input.relatedId ? { related: { type: input.context, id: input.relatedId } } : {}) } }));
    return { text: String(rendered.text ?? rendered.message ?? ""), phone: String(rendered.phone_e164 ?? rendered.phone ?? "") };
  } catch (error) { return { error: errorText(error) }; }
}

export async function logFollowup(input: { targetType: "customer" | "lead"; targetId: string; context: string; templateId: string; relatedId?: string; text: string }): Promise<{ error?: string }> {
  if (!id.safeParse(input.targetId).success || !id.safeParse(input.templateId).success || input.text.length > 1000) return { error: "Unable to record this contact." };
  const workspace = await getWorkspace("/activities");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest("/followups/log", { method: "POST", token: workspace.token, organizationId: workspace.organizationId, body: { [`${input.targetType}_id`]: input.targetId, template_id: input.templateId, ...(input.relatedId ? { related: { type: input.context, id: input.relatedId } } : {}), text: input.text } });
    revalidatePath("/activities");
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function uploadImport(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (kind !== "customers" && kind !== "products") return { error: "Choose customers or products." };
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv") || file.size === 0 || file.size > 2 * 1024 * 1024) return { field: "file", error: "Choose a CSV file under 2 MB." };
  const workspace = await getWorkspace(`/imports/new/${kind}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  const upload = new FormData(); upload.set("kind", kind); upload.set("file", file);
  try {
    const response = await fetch(`${(process.env.NESTJS_API_BASE_URL || "https://aw-crm-mu.vercel.app/api/v1").replace(/\/$/, "")}/imports`, { method: "POST", headers: { Authorization: `Bearer ${workspace.token}`, "X-Organization-Id": workspace.organizationId, "Idempotency-Key": crypto.randomUUID() }, body: upload, cache: "no-store" });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) { const problem = record(record(payload).error); return { error: String(problem.message ?? "Unable to upload CSV.") }; }
    const saved = unwrap(payload);
    revalidatePath("/imports");
    return { destination: id.safeParse(saved.id).success ? `/imports/new/${kind}?job=${saved.id}&step=2` : "/imports" };
  } catch { return { error: "Cannot reach the server. Retry the upload." }; }
}

export async function saveImportMapping(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const kind = String(form.get("kind") ?? "");
  const jobId = String(form.get("job_id") ?? "");
  if (!["customers", "products"].includes(kind) || !id.safeParse(jobId).success) return { error: "Invalid import job." };
  let mapping: unknown;
  try { mapping = JSON.parse(String(form.get("mapping") ?? "")); } catch { return { error: "Map the required columns." }; }
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) return { error: "Map the required columns." };
  const workspace = await getWorkspace(`/imports/new/${kind}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/imports/${jobId}/mapping`, { method: "PUT", token: workspace.token, organizationId: workspace.organizationId, body: { mapping } });
    revalidatePath(`/imports/new/${kind}`);
    return { destination: `/imports/new/${kind}?job=${jobId}&step=3` };
  } catch (error) { return { error: errorText(error) }; }
}

export async function commitImport(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const kind = String(form.get("kind") ?? "");
  const jobId = String(form.get("job_id") ?? "");
  const policy = String(form.get("duplicate_policy") ?? "skip");
  if (!["customers", "products"].includes(kind) || !id.safeParse(jobId).success || !["skip", "update"].includes(policy)) return { error: "Invalid import request." };
  const workspace = await getWorkspace(`/imports/new/${kind}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/imports/${jobId}/commit`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: jobId, body: { duplicate_policy: policy } });
    revalidatePath("/imports");
    return { destination: `/imports/new/${kind}?job=${jobId}&step=4` };
  } catch (error) { return { error: errorText(error) }; }
}

export async function applyCredit(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const creditId = String(form.get("credit_id") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const amount = pkrToPaisa(String(form.get("amount") ?? ""));
  if (!id.safeParse(creditId).success || !id.safeParse(orderId).success) return { error: "Choose a valid order." };
  if (amount === null || amount <= 0) return { error: "Enter a positive amount." };
  const workspace = await getWorkspace(`/credit-notes/${creditId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const [credit, order] = await Promise.all([
      apiRequest(`/credit-notes/${creditId}`, { token: workspace.token, organizationId: workspace.organizationId }),
      apiRequest(`/orders/${orderId}`, { token: workspace.token, organizationId: workspace.organizationId }),
    ]);
    const creditData = unwrap(credit);
    const orderData = unwrap(order);
    if (creditData.customer_id !== orderData.customer_id) return { error: "Choose an order for this customer." };
    if (amount > Number(creditData.remaining_paisa ?? 0) || amount > Number(orderData.outstanding_paisa ?? 0)) return { error: "Amount exceeds the credit left or the order balance." };
    await apiRequest(`/credit-notes/${creditId}/apply`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: crypto.randomUUID(), body: { order_id: orderId, amount_paisa: amount } });
    revalidatePath(`/credit-notes/${creditId}`); revalidatePath("/credit-notes"); revalidatePath(`/orders/${orderId}`);
    return { destination: `/credit-notes/${creditId}` };
  } catch (error) { return { error: errorText(error) }; }
}

export async function voidCredit(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const creditId = String(form.get("credit_id") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!id.safeParse(creditId).success || !reason) return { error: "Enter a reason to void this credit note." };
  const workspace = await getWorkspace(`/credit-notes/${creditId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/credit-notes/${creditId}/void`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: crypto.randomUUID(), body: { reason } });
    revalidatePath(`/credit-notes/${creditId}`); revalidatePath("/credit-notes");
    return { destination: `/credit-notes/${creditId}` };
  } catch (error) { return { error: errorText(error) }; }
}

export async function moveLead(leadId: string, stageId: string, version: number, reason?: string): Promise<{ error?: string }> {
  if (!id.safeParse(leadId).success || !id.safeParse(stageId).success || !Number.isSafeInteger(version) || version < 1) return { error: "Invalid lead or stage." };
  const workspace = await getWorkspace(`/leads/${leadId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const stages = items(await apiRequest("/pipeline/stages", { token: workspace.token, organizationId: workspace.organizationId }));
    const stage = stages.find(item => item.id === stageId);
    if (!stage) return { error: "Choose a valid stage." };
    if (stage.kind === "lost" && !reason?.trim()) return { error: "Please say why the lead was lost." };
    await apiRequest(`/leads/${leadId}/move`, { method: "POST", token: workspace.token, organizationId: workspace.organizationId, body: { stage_id: stageId, expected_version: version, ...(reason ? { lost_reason: reason.trim() } : {}) } });
    revalidatePath("/leads"); revalidatePath(`/leads/${leadId}`);
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function transitionLead(leadId: string, operation: "archive" | "restore" | "convert", version: number, existingCustomerId?: string): Promise<{ error?: string; destination?: string }> {
  if (!id.safeParse(leadId).success || !["archive", "restore", "convert"].includes(operation)) return { error: "Invalid lead action." };
  if (operation === "convert" && (!Number.isSafeInteger(version) || version < 1 || (existingCustomerId && !id.safeParse(existingCustomerId).success))) return { error: "Reload the lead and retry." };
  const workspace = await getWorkspace(`/leads/${leadId}`);
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const result = unwrap(await apiRequest(`/leads/${leadId}/${operation}`, {
      method: "POST", token: workspace.token, organizationId: workspace.organizationId,
      idempotencyKey: operation === "convert" ? crypto.randomUUID() : undefined,
      body: operation === "convert" ? { expected_version: version, ...(existingCustomerId ? { existing_customer_id: existingCustomerId } : {}) } : undefined,
    }));
    revalidatePath("/leads"); revalidatePath(`/leads/${leadId}`);
    if (operation === "convert") revalidatePath("/customers");
    const customerId = result.customer_id ?? record(result.customer).id;
    return { destination: operation === "convert" && id.safeParse(customerId).success ? `/customers/${customerId}` : undefined };
  } catch (error) { return { error: errorText(error) }; }
}

export async function saveTemplate(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const templateId = String(form.get("template_id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const key = String(form.get("key") ?? "").trim();
  const context = String(form.get("context") ?? "");
  const locale = String(form.get("locale") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (templateId && !id.safeParse(templateId).success) return { error: "Invalid template." };
  if (!name || name.length > 100 || (!templateId && !/^custom_[a-z0-9_]+$/.test(key))) return { error: "Use a name up to 100 characters and a key beginning custom_." };
  if (!["general", "lead", "quotation", "receivable", "order"].includes(context) || !["en", "ur-Latn"].includes(locale)) return { error: "Choose a context and language." };
  if (!body || body.length > 1000) return { field: "body", error: "Message must be 1 to 1000 characters." };
  const allowedByContext: Record<string, string[]> = { receivable: ["customer_name", "business_name", "amount_due", "order_number"], quotation: ["customer_name", "business_name", "quotation_number", "valid_until", "quotation_total"], order: ["customer_name", "business_name", "order_number"], lead: ["customer_name", "business_name"], general: ["customer_name", "business_name", "amount_due"] };
  const allowed = new Set(allowedByContext[context]);
  const placeholders = [...body.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]);
  const unknown = placeholders.filter(token => !allowed.has(token));
  if (unknown.length) return { field: "body", error: `Unknown placeholder: ${unknown.join(", ")}` };
  const workspace = await getWorkspace("/settings/message-templates");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const version = Number(form.get("version"));
    if (templateId && (!Number.isSafeInteger(version) || version < 1)) return { error: "Reload the template and try again." };
    await apiRequest(`/message-templates${templateId ? `/${templateId}` : ""}`, { method: templateId ? "PATCH" : "POST", token: workspace.token, organizationId: workspace.organizationId, body: templateId ? { name, body, expected_version: version } : { name, key, context, locale, body } });
    revalidatePath("/settings/message-templates");
    return { destination: "/settings/message-templates" };
  } catch (error) { return { error: errorText(error) }; }
}

export async function reorderStages(stageIds: string[]): Promise<{ error?: string }> {
  if (!Array.isArray(stageIds) || !stageIds.length || stageIds.some(stageId => !id.safeParse(stageId).success) || new Set(stageIds).size !== stageIds.length) return { error: "Invalid stage order." };
  const workspace = await getWorkspace("/settings/pipeline");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const current = items(await apiRequest("/pipeline/stages", { token: workspace.token, organizationId: workspace.organizationId }));
    if (current.length !== stageIds.length || current.some(stage => !stageIds.includes(String(stage.id)))) return { error: "Stages changed. Reload before reordering." };
    await apiRequest("/pipeline/stages/reorder", { method: "POST", token: workspace.token, organizationId: workspace.organizationId, body: { ids: stageIds } });
    revalidatePath("/settings/pipeline"); revalidatePath("/leads");
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function deletePipelineStage(stageId: string, moveTo?: string): Promise<{ error?: string }> {
  if (!id.safeParse(stageId).success || (moveTo && (!id.safeParse(moveTo).success || moveTo === stageId))) return { error: "Choose a valid destination stage." };
  const workspace = await getWorkspace("/settings/pipeline");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/pipeline/stages/${stageId}`, { method: "DELETE", token: workspace.token, organizationId: workspace.organizationId, query: moveTo ? { move_to: moveTo } : undefined });
    revalidatePath("/settings/pipeline"); revalidatePath("/leads");
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function archiveMessageTemplate(templateId: string): Promise<{ error?: string }> {
  if (!id.safeParse(templateId).success) return { error: "Invalid template." };
  const workspace = await getWorkspace("/settings/message-templates");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest(`/message-templates/${templateId}`, { method: "DELETE", token: workspace.token, organizationId: workspace.organizationId });
    revalidatePath("/settings/message-templates");
    return {};
  } catch (error) { return { error: errorText(error) }; }
}

export async function createRefund(_previous: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const customerId = String(form.get("customer_id") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const accountId = String(form.get("payment_account_id") ?? "");
  const amount = pkrToPaisa(String(form.get("amount") ?? ""));
  const method = String(form.get("method") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  const reference = String(form.get("reference") ?? "").trim();
  const key = String(form.get("operation_key") ?? "");
  if (!id.safeParse(customerId).success) return { field: "customer_id", error: "Choose a customer." };
  if (orderId && !id.safeParse(orderId).success) return { field: "order_id", error: "Choose a valid order." };
  if (accountId && !id.safeParse(accountId).success) return { field: "payment_account_id", error: "Choose a valid account." };
  if (amount === null || amount < 1) return { field: "amount", error: "Enter an amount greater than zero." };
  if (!["cash", "bank_transfer", "easypaisa", "jazzcash", "mobile_wallet", "cheque", "other"].includes(method)) return { field: "method", error: "Choose a refund method." };
  if (reason.length < 3 || reason.length > 300) return { field: "reason", error: "Give a reason between 3 and 300 characters." };
  if (reference.length > 120) return { field: "reference", error: "Reference is too long." };
  if (!id.safeParse(key).success) return { error: "Reload the form and retry." };
  const workspace = await getWorkspace("/payments/refunds");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    await apiRequest("/refunds", { method: "POST", token: workspace.token, organizationId: workspace.organizationId, idempotencyKey: key, body: { customer_id: customerId, amount_paisa: amount, method, reason, ...(orderId ? { order_id: orderId } : {}), ...(accountId ? { payment_account_id: accountId } : {}), ...(reference ? { reference } : {}) } });
    revalidatePath("/payments/refunds"); revalidatePath("/payments"); revalidatePath(`/customers/${customerId}`);
    if (orderId) revalidatePath(`/orders/${orderId}`);
    return { destination: "/payments/refunds" };
  } catch (error) { return { error: errorText(error) }; }
}

export async function refundOrders(customerId: string): Promise<{ orders: { id: string; name: string }[]; error?: string }> {
  if (!id.safeParse(customerId).success) return { orders: [], error: "Choose a customer." };
  const workspace = await getWorkspace("/payments/refunds");
  if (!workspace.organizationId) return { orders: [], error: "Select an organization first." };
  try {
    const orders = items(await apiRequest("/orders", { token: workspace.token, organizationId: workspace.organizationId, query: { customer_id: customerId, limit: 100 } }));
    return { orders: orders.map(order => ({ id: String(order.id), name: String(order.order_number ?? order.number ?? order.id) })) };
  } catch (error) { return { orders: [], error: errorText(error) }; }
}
