import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, MailPlus, Search, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { TeamInviteForm } from "@/components/shared/team-invite-form";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const label = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : fallback;
function totalFrom(value: unknown) {
  const envelope = record(value);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  return typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
}
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase(); }

export default function TeamPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Team" />}><TeamContent searchParams={searchParams} /></Suspense>;
}

async function TeamContent({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 100) : "";
  let organizationName = "WORKSPACE";
  let noOrganization = false;
  let data: unknown = null;
  let error = "";
  try {
    const workspace = await getWorkspace("/team");
    organizationName = label(workspace.organization?.name, "WORKSPACE");
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) data = await apiRequest(`/organizations/${encodeURIComponent(workspace.organizationId)}/members`, { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: 20, ...(search ? { search } : {}) } });
  } catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load team members."; }
  const rows = items(data);
  const total = totalFrom(data);
  const hasNext = total === undefined ? rows.length === 20 : page * 20 < total;
  const active = rows.filter(row => String(row.status ?? "active").toLowerCase() === "active").length;
  const managers = rows.filter(row => ["owner", "admin", "manager"].includes(String(row.role ?? "").toLowerCase())).length;
  const paginationHref = (next: number) => `/team?page=${next}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  return <div className="team-page"><header className="team-header"><div><div className="module-eyebrow">{organizationName} / PEOPLE</div><h1>Your team<span>.</span></h1><p>Invite collaborators and manage access to your workspace.</p></div><a href="#invite-member" className="team-primary"><MailPlus size={16} /> Invite member</a></header>
    <section className="team-metrics" aria-label="Team overview"><article><span className="team-metric-icon blue"><UsersRound size={20} /></span><div><small>Members</small><strong>{total ?? rows.length}</strong><p>{total === undefined ? "On this page" : "In this workspace"}</p></div></article><article><span className="team-metric-icon green"><UserRoundCheck size={20} /></span><div><small>Active now</small><strong>{active}</strong><p>Among shown members</p></div></article><article><span className="team-metric-icon violet"><ShieldCheck size={20} /></span><div><small>Leads & admins</small><strong>{managers}</strong><p>Among shown members</p></div></article></section>
    <div className="team-layout"><TeamInviteForm organizationName={organizationName} /><aside className="team-side-card"><span><ShieldCheck size={21} /></span><h2>Access stays in your hands.</h2><p>Choose a role when you invite someone. You can update or remove members from the list below.</p><div><strong>Invitation delivery</strong><small>The API returns a token valid for 7 days. Copy it and share it with the person you invited.</small></div><Link href="/settings">Workspace settings <ArrowUpRight size={15} /></Link></aside></div>
    <section className="team-list" aria-label="Workspace members"><div className="team-list-heading"><div><span>PEOPLE IN YOUR WORKSPACE</span><h2>Members</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} members`} · {rows.length} shown</p></div></div><form className="team-search" action="/team" method="get"><label><span>Find a member</span><div><Search size={16} /><input name="search" type="search" defaultValue={search} placeholder="Search by name or email" /></div></label><button type="submit">Search</button>{search && <Link href="/team">Clear</Link>}</form>
      {error ? <div className="team-state" role="alert">{error}</div> : noOrganization ? <div className="team-state">Select or create an organization to view your team.</div> : data === null ? <div className="team-state">Team data is unavailable.</div> : rows.length === 0 ? <div className="team-state"><span><UsersRound size={27} /></span><strong>{search ? "No matching members" : "Your team starts here"}</strong><p>{search ? "Try a different name or email." : "Invite a collaborator to work together."}</p></div> : <div className="team-member-list">{rows.map((member, index) => { const id = typeof member.id === "string" ? member.id : ""; const name = label(member.name, label(member.email, "Member")); return <article key={id || index}><div className="team-member-main"><span className="team-member-avatar">{initials(name)}</span><div><strong>{name}</strong><small>{label(member.email, label(member.phone, "No contact details"))}</small></div></div><span className="team-member-role">{label(member.role)}</span><StatusBadge value={String(member.status ?? "active")} />{id && <div className="team-member-actions"><OperationForm operationId="team.update" entityId={id} defaults={member} /><OperationForm operationId="team.remove" entityId={id} /></div>}</article>; })}</div>}
    </section>{data !== null && rows.length > 0 && <nav className="pagination" aria-label="Team pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} members` : ""}</span><div>{page > 1 && <Link href={paginationHref(page - 1)}>Previous</Link>}{hasNext && <Link href={paginationHref(page + 1)}>Next</Link>}</div></nav>}
  </div>;
}
