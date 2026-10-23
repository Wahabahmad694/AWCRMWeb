import { API_BASE, getWorkspace } from "@/lib/api";
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "customers.csv" && kind !== "products.csv") return new Response("Unknown template", { status: 404 });
  const workspace = await getWorkspace("/imports");
  if (!workspace.organizationId) return new Response("Select an organization", { status: 400 });
  try {
    const response = await fetch(`${API_BASE}/imports/templates/${kind}`, { cache: "no-store", headers: { Authorization: `Bearer ${workspace.token}`, "X-Organization-Id": workspace.organizationId, Accept: "text/csv" } });
    if (!response.ok) return new Response("Template unavailable", { status: response.status });
    return new Response(response.body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}"` } });
  } catch { return new Response("Cannot reach the server", { status: 503 }); }
}
