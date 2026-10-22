import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, CalendarDays, Target, TrendingUp, UsersRound } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { TargetCreateForm } from "@/components/shared/target-create-form";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const label = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : fallback;
const money = (value: unknown) => typeof value === "number" ? formatPaisa(value) : "—";
function totalFrom(value: unknown) {
  const envelope = record(value);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  return typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
}

export default function SalesTargetsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Sales targets" />}><SalesTargetsContent searchParams={searchParams} /></Suspense>;
}

async function SalesTargetsContent({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  let organizationName = "WORKSPACE";
  let targetData: unknown = null;
  let targetError = "";
  let memberError = "";
  let noOrganization = false;
  let members: { id: string; name: string; detail: string }[] = [];
  let memberLimitReached = false;
  try {
    const workspace = await getWorkspace("/sales-targets");
    organizationName = label(workspace.organization?.name, "WORKSPACE");
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) {
      const organizationId = workspace.organizationId;
      const [targets, firstMembers] = await Promise.allSettled([
        apiRequest("/targets", { token: workspace.token, organizationId, query: { page, limit: 20 } }),
        apiRequest(`/organizations/${encodeURIComponent(organizationId)}/members`, { token: workspace.token, organizationId, query: { page: 1, limit: 100 } }),
      ]);
      if (targets.status === "fulfilled") targetData = targets.value;
      else targetError = targets.reason instanceof ApiError ? targets.reason.message : "Unable to load sales targets.";
      if (firstMembers.status === "fulfilled") {
        const memberRows = items(firstMembers.value);
        const memberTotal = totalFrom(firstMembers.value);
        if (memberTotal !== undefined && memberTotal > memberRows.length) {
          const lastPage = Math.min(10, Math.ceil(memberTotal / 100));
          const more = await Promise.allSettled(Array.from({ length: lastPage - 1 }, (_, index) => apiRequest(`/organizations/${encodeURIComponent(organizationId)}/members`, { token: workspace.token, organizationId, query: { page: index + 2, limit: 100 } })));
          for (const result of more) if (result.status === "fulfilled") memberRows.push(...items(result.value));
          memberLimitReached = memberRows.length < memberTotal;
        } else memberLimitReached = memberRows.length === 100;
        members = memberRows.filter(row => String(row.status ?? "active").toLowerCase() === "active").map(row => {
          const user = record(row.user);
          const id = row.user_id ?? row.userId ?? user.id;
          return { id: typeof id === "string" ? id : "", name: label(user.name, label(row.name, label(user.email, label(row.email, "Team member")))), detail: label(user.email, label(row.email, label(row.role, ""))) };
        }).filter(member => member.id);
        if (memberRows.length > 0 && members.length === 0) memberError = "The team API did not return user IDs for its members.";
      } else memberError = firstMembers.reason instanceof ApiError ? firstMembers.reason.message : "Unable to load team members.";
    }
  } catch (error) { targetError = error instanceof ApiError ? error.message : "Unable to load your workspace."; }

  const rows = items(targetData);
  const total = totalFrom(targetData);
  const hasNext = total === undefined ? rows.length === 20 : page * 20 < total;
  const active = rows.filter(row => row.archived_at == null && row.is_archived !== true);
  const planned = active.reduce((sum, row) => sum + (typeof row.amount_paisa === "number" ? row.amount_paisa : 0), 0);
  const achieved = active.reduce((sum, row) => sum + (typeof row.current_sales_paisa === "number" ? row.current_sales_paisa : typeof row.achieved_paisa === "number" ? row.achieved_paisa : 0), 0);
  const names = new Map(members.map(member => [member.id, member.name]));

  return <div className="targets-page">
    <header className="targets-header"><div><div className="module-eyebrow">{organizationName} / GROWTH</div><h1>Sales targets<span>.</span></h1><p>Set a direction, see the numbers, and keep progress in view.</p></div><a href="#create-target" className="targets-primary">+ Create target</a></header>
    <section className="targets-metrics" aria-label="Target overview"><article><span className="targets-metric-icon blue"><Target size={20} /></span><div><small>Total targets</small><strong>{total ?? rows.length}</strong><p>{total === undefined ? "On this page" : "Across your workspace"}</p></div></article><article><span className="targets-metric-icon violet"><TrendingUp size={20} /></span><div><small>Planned value</small><strong>{money(planned)}</strong><p>Active targets on this page</p></div></article><article><span className="targets-metric-icon mint"><UsersRound size={20} /></span><div><small>Achieved</small><strong>{money(achieved)}</strong><p>Recorded progress on this page</p></div></article></section>
    <div className="targets-layout"><TargetCreateForm members={members} memberError={memberError} memberLimitReached={memberLimitReached} /><aside className="targets-insight"><span className="targets-insight-icon"><Target size={21} /></span><span className="targets-overline">PLAN WITH PURPOSE</span><h2>Give every goal a clear owner.</h2><p>Assign a target to a team member, or set an organization wide goal.</p><div><span>Selected team member</span><strong>Their user ID is submitted with the target</strong></div><Link href="/team">Open team directory <ArrowUpRight size={15} /></Link></aside></div>
    <section className="targets-list" aria-label="Sales targets"><div className="targets-list-heading"><div><span>PERFORMANCE TRACKER</span><h2>Current targets</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} targets`} · {rows.length} shown</p></div><span>Values in PKR</span></div>
      {targetError ? <div className="targets-state" role="alert">{targetError}</div> : noOrganization ? <div className="targets-state">Select or create an organization to view targets.</div> : targetData === null ? <div className="targets-state">Target data is unavailable.</div> : rows.length === 0 ? <div className="targets-state"><span><Target size={28} /></span><strong>Your goals start here</strong><p>Create a sales target to begin measuring progress.</p></div> : <div className="targets-table-scroll"><table className="targets-table"><thead><tr><th>Target</th><th>Owner</th><th>Period</th><th>Progress</th><th>Goal</th><th aria-label="Open target" /></tr></thead><tbody>{rows.map((row, index) => {
        const id = typeof row.id === "string" ? row.id : "";
        const goal = typeof row.amount_paisa === "number" ? row.amount_paisa : 0;
        const current = typeof row.current_sales_paisa === "number" ? row.current_sales_paisa : typeof row.achieved_paisa === "number" ? row.achieved_paisa : 0;
        const percent = goal > 0 ? Math.max(0, Math.min(100, Math.round(current / goal * 100))) : 0;
        const scope = label(row.scope, "organization");
        const owner = scope === "user" ? names.get(String(row.user_id ?? "")) ?? label(row.user_name, "Team member") : "Organization";
        return <tr key={id || index}><td><div className="targets-table-name"><span><Target size={16} /></span><div>{id ? <Link href={`/sales-targets/${encodeURIComponent(id)}`}>{label(row.name, "Sales target")}</Link> : <strong>{label(row.name, "Sales target")}</strong>}<small>{row.archived_at || row.is_archived === true ? "Archived" : scope === "user" ? "Team member target" : "Organization target"}</small></div></div></td><td>{owner}</td><td><span className="targets-period"><CalendarDays size={14} /> {label(row.month, label(row.period_start))}</span></td><td><div className="targets-progress"><div><strong>{percent}%</strong><span>{money(current)} achieved</span></div><span className="targets-progress-track"><span style={{ width: `${percent}%` }} /></span></div></td><td className="targets-amount">{money(row.amount_paisa)}</td><td>{id && <Link href={`/sales-targets/${encodeURIComponent(id)}`} className="targets-view">View <ArrowUpRight size={14} /></Link>}</td></tr>;
      })}</tbody></table></div>}
    </section>{targetData !== null && rows.length > 0 && <nav className="pagination" aria-label="Target pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={`/sales-targets?page=${page - 1}`}>Previous</Link>}{hasNext && <Link href={`/sales-targets?page=${page + 1}`}>Next</Link>}</div></nav>}
  </div>;
}
