import { ApiError, apiRequest, getWorkspace, items } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";

export default async function Page({ searchParams }: { searchParams: Promise<{page?: string; search?: string}> }) {
  const workspace = await getWorkspace();
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1));
  const search = typeof params.search === "string" ? params.search.trim().slice(0,100) : "";
  let rows: Record<string, unknown>[] = [];
  let error = "";
  try { if (workspace.organizationId) rows = items(await apiRequest(`/organizations/${workspace.organizationId}/members`, { token:workspace.token, query:{page,limit:20,search} })); }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load members."; }
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">{String(workspace.organization?.name ?? "WORKSPACE")}</div><h1>Team</h1><p>Manage workspace access.</p></div></div><div className="operation-grid"><OperationForm operationId="team.invite" /></div><form className="resource-search"><label htmlFor="team-search">Search members</label><div><input id="team-search" name="search" defaultValue={search} /><button>Search</button></div></form>{error && <div className="notice" role="alert">{error}</div>}<section className="panel member-list">{rows.length ? rows.map((member,index) => <article key={String(member.id ?? index)}><div><strong>{String(member.name ?? member.email ?? "Member")}</strong><p>{String(member.email ?? "")} · {String(member.role ?? "")}</p></div>{typeof member.id === "string" && <div className="operation-grid"><OperationForm operationId="team.update" entityId={member.id} defaults={member} /><OperationForm operationId="team.remove" entityId={member.id} /></div>}</article>) : <div className="resource-state">No members found.</div>}</section></div>;
}
