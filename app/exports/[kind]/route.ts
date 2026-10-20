import { API_BASE, getWorkspace } from "@/lib/api";

const allowed = new Set(["customers", "orders", "payments", "expenses"]);
export async function GET(request: Request, { params }: { params: Promise<{kind: string}> }) {
  const { kind } = await params;
  if (!allowed.has(kind)) return new Response("Not found", { status:404 });
  const workspace = await getWorkspace();
  if (!workspace.organizationId) return new Response("No organization selected", { status:400 });
  const incoming = new URL(request.url);
  const url = new URL(`${API_BASE}/exports/${kind}.csv`);
  for (const key of ["from","to"]) {
    const value = incoming.searchParams.get(key);
    if (value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Response("Invalid date", { status:400 });
      url.searchParams.set(key,value);
    }
  }
  let upstream: Response;
  try { upstream = await fetch(url, { headers:{ Authorization:`Bearer ${workspace.token}`, "X-Organization-Id":workspace.organizationId }, cache:"no-store" }); }
  catch { return new Response("Export API unavailable", { status:503 }); }
  if (!upstream.ok) return new Response("Export unavailable", { status:upstream.status });
  return new Response(upstream.body, { headers:{ "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="aw-${kind}.csv"`, "Cache-Control":"no-store" } });
}
