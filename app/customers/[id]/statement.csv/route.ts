import { API_BASE, getWorkspace } from "@/lib/api";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Invalid customer ID", { status: 400 });
  const input = new URL(request.url).searchParams;
  const from = input.get("from") ?? "";
  const to = input.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return new Response("Invalid date range", { status: 400 });
  const workspace = await getWorkspace(`/customers/${id}/statement`);
  if (!workspace.organizationId) return new Response("Select an organization", { status: 400 });
  const url = new URL(`${API_BASE}/customers/${id}/statement.csv`);
  url.searchParams.set("from", from); url.searchParams.set("to", to);
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${workspace.token}`, "X-Organization-Id": workspace.organizationId, Accept: "text/csv" } });
    if (!response.ok) return new Response(response.status === 403 ? "Permission denied" : "CSV unavailable", { status: response.status });
    return new Response(response.body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="statement-${id}.csv"` } });
  } catch { return new Response("Cannot reach the server", { status: 503 }); }
}
