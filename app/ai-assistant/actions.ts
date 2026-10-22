"use server";

import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

export type AssistantReply = { answer?: string; error?: string };
type Workspace = Awaited<ReturnType<typeof getWorkspace>>;

function amount(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "unavailable"; }
function count(value: unknown) { return typeof value === "number" ? value.toLocaleString("en-PK") : "unavailable"; }
function name(row: Record<string, unknown>) { return String(row.customer_name ?? row.product_name ?? row.name ?? record(row.customer).name ?? "Unnamed record"); }
function firstNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (typeof row[key] === "number") return row[key] as number;
  return undefined;
}
async function read(workspace: Workspace, path: string, query?: Record<string, number>) {
  return apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query });
}

/** Answer supported questions using verified CRM endpoints. */
async function answerFromRecords(question: string, workspace: Workspace): Promise<AssistantReply> {
  const q = question.toLowerCase();
  try {
    if (/sale|revenue|فروخت|سیل|kamai|آمدن/.test(q)) {
      const summary = unwrap(await read(workspace, "/dashboard/summary"));
      const today = record(summary.today);
      const month = record(summary.month_to_date);
      return { answer: `From your live dashboard:\n• Net sales today: ${amount(today.net_sales_paisa)}\n• Sales this month: ${amount(month.net_sales_paisa)}\n• Orders this month: ${count(month.orders)}\n\nOpen Reports for more detail.` };
    }
    if (/receivable|pending payment|outstanding|balance|udhaar|بقا|بقایا|payment/.test(q)) {
      const rows = items(await read(workspace, "/receivables", { page: 1, limit: 5 }));
      if (!rows.length) return { answer: "The receivables list has no outstanding customer balances to show right now. Check Payments for the full record." };
      const lines = rows.map(row => `• ${name(row)}: ${amount(firstNumber(row, ["balance_paisa", "outstanding_paisa", "amount_paisa"]))}`);
      return { answer: `Outstanding customer balances from live records (first ${rows.length}):\n${lines.join("\n")}\n\nOpen Payments → Receivables for the full list.` };
    }
    if (/top customer|best customer|customer.*top|بہترین گاہک/.test(q)) {
      const rows = items(await read(workspace, "/sales/by-customer"));
      if (!rows.length) return { answer: "There are no ranked customers in the sales report yet." };
      const lines = rows.slice(0, 5).map((row, index) => `${index + 1}. ${name(row)} — ${amount(firstNumber(row, ["net_sales_paisa", "sales_paisa", "total_paisa", "amount_paisa"]))}`);
      return { answer: `Top customers from the live sales report:\n${lines.join("\n")}\n\nOpen Reports for the full view.` };
    }
    if (/stock|inventory|product|اسٹاک|maal/.test(q)) {
      const rows = items(await read(workspace, "/inventory/low-stock"));
      if (!rows.length) return { answer: "The low-stock view has no items needing attention right now." };
      const lines = rows.slice(0, 5).map(row => `• ${name(row)}: ${count(firstNumber(row, ["on_hand", "quantity"]))} on hand`);
      return { answer: `Low-stock products from your live inventory:\n${lines.join("\n")}\n\nOpen Inventory → Low stock for the full list.` };
    }
    if (/follow.?up|reminder|اگلا|یاد دہانی/.test(q)) {
      const rows = items(await read(workspace, "/reminders", { page: 1, limit: 5 })).filter(row => row.completed !== true);
      if (!rows.length) return { answer: "There are no open reminders in the recent list right now." };
      const lines = rows.map(row => `• ${String(row.subject ?? "Reminder")}${typeof row.due_at === "string" ? ` — due ${row.due_at.slice(0, 10)}` : ""}`);
      return { answer: `Open reminders from your live workspace:\n${lines.join("\n")}\n\nOpen Activities → Reminders for the full list.` };
    }
    if (/order|آرڈر/.test(q)) {
      const rows = items(await read(workspace, "/orders", { page: 1, limit: 5 }));
      if (!rows.length) return { answer: "There are no recent orders to show right now." };
      const lines = rows.map(row => `• ${String(row.order_number ?? row.number ?? "Order")}: ${String(row.status ?? "status unavailable")} — ${amount(row.total_paisa)}`);
      return { answer: `Recent orders from your live workspace:\n${lines.join("\n")}\n\nOpen Orders for the full list.` };
    }
    return { answer: "I can answer questions about sales, top customers, outstanding payments, low stock, recent orders, and reminders from your live CRM records. Try one of the suggested questions." };
  } catch (cause) {
    return { error: cause instanceof ApiError ? `I couldn’t read the requested business data: ${cause.message}` : "I couldn’t read the requested business data. Try again shortly." };
  }
}

export async function askAssistant(message: string): Promise<AssistantReply> {
  const question = typeof message === "string" ? message.trim() : "";
  if (!question) return { error: "Enter a question to continue." };
  if (question.length > 2000) return { error: "Keep your question under 2,000 characters." };
  let workspace: Workspace;
  try { workspace = await getWorkspace("/ai-assistant"); }
  catch (cause) { return { error: cause instanceof ApiError ? cause.message : "Unable to access your workspace." }; }
  if (!workspace.organizationId) return { error: "Select or create an organization before asking about business data." };
  return answerFromRecords(question, workspace);
}
