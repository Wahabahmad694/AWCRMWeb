import { Suspense } from "react";
import { ArrowRight, Columns3, List, Plus, Search, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { moduleList, value } from "@/lib/module-data";
import { record } from "@/lib/api";
import { LeadMoveControl } from "@/components/modules/lead-move-control";
import { formatDate, formatPkr } from "@/lib/crm-format";

type Filters = { view?: string; search?: string; source?: string; stage_id?: string; archived?: string; overdue?: string; page?: string };
const sources = ["walk_in", "referral", "whatsapp", "facebook", "other"];

export default function LeadsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / PIPELINE" title="Leads" description="Loading leads…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading leads"><div /><div /><div /><div /></div></ModuleCard></div>}><LeadsContent searchParams={searchParams} /></Suspense>;
}

async function LeadsContent({ searchParams }: { searchParams: Promise<Filters> }) {
  const query = await searchParams;
  const view = query.view === "list" ? "list" : "board";
  const search = (query.search ?? "").slice(0, 100);
  const source = sources.includes(query.source ?? "") ? query.source : undefined;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const [result, pipeline] = await Promise.all([
    view === "list"
      ? moduleList("/leads", { page, limit: 20, search: search || undefined, source, stage_id: query.stage_id || undefined, overdue: query.overdue === "true" ? "true" : undefined, include_archived: query.archived === "true" ? "true" : undefined })
      : moduleList("/leads/board", { search: search || undefined, source, per_column: 20 }),
    moduleList("/pipeline/stages"),
  ]);
  const columns = view === "board" ? Array.isArray(result.data.columns) ? result.data.columns.map(record) : result.rows : [];
  const list = view === "list" ? result.rows : [];
  const stages = pipeline.rows.map(stage => ({ id: String(stage.id), name: value(stage, "name"), kind: String(stage.kind ?? "open") })).filter(stage => stage.id);
  const stageId = stages.some(stage => stage.id === query.stage_id) ? query.stage_id : "";
  const href = (changes: Partial<Filters>) => `/leads?${new URLSearchParams(Object.entries({ ...query, view, ...changes }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")).toString()}`;
  const hasNext = list.length === 20;

  return <div className="module-page leads-page">
    <header className="leads-hero"><div><span className="leads-eyebrow"><Sparkles size={14} /> SALES WORKSPACE <span>/</span> PIPELINE</span><h1>Leads</h1><p>Follow every opportunity from first contact through conversion.</p></div><Link className="leads-create" href="/leads/new"><Plus size={17} /> New lead</Link></header>
    <ModuleCard className="leads-toolbar-card"><div className="leads-toolbar-heading"><span className="leads-toolbar-icon"><UsersRound size={19} /></span><div><h2>Lead pipeline</h2><p>Keep your opportunities moving forward</p></div></div><div className="module-toolbar"><form className="module-filter leads-filter" action="/leads"><label className="leads-search"><Search size={16} /><input aria-label="Search leads" name="search" placeholder="Search name, company or phone" defaultValue={search} /></label><input type="hidden" name="view" value={view} /><select name="source" aria-label="Source" defaultValue={source ?? ""}><option value="">All sources</option>{sources.map(item => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select>{view === "list" && <><select name="stage_id" aria-label="Stage" defaultValue={stageId}><option value="">All stages</option>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select><label className="module-inline-check"><input type="checkbox" name="overdue" value="true" defaultChecked={query.overdue === "true"} /> Overdue</label><label className="module-inline-check"><input type="checkbox" name="archived" value="true" defaultChecked={query.archived === "true"} /> Include archived</label></>}<button type="submit"><SlidersHorizontal size={15} /> Apply filters</button></form><div className="module-segment leads-view-toggle"><Link className={view === "board" ? "active" : ""} href={href({ view: "board", page: "", archived: "", overdue: "", stage_id: "" })}><Columns3 size={15} /> Board</Link><Link className={view === "list" ? "active" : ""} href={href({ view: "list", page: "" })}><List size={15} /> List</Link></div></div></ModuleCard>
    {result.error ? <ModuleCard><div role="alert" className="module-state"><p>{result.error}</p><Link href="/leads">Retry</Link></div></ModuleCard> : view === "list" ? <ModuleCard>{list.length ? <><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Name</th><th>Company</th><th>Stage</th><th>Source</th><th className="money-cell">Expected value</th><th>Follow-up</th></tr></thead><tbody>{list.map((lead, index) => <tr key={String(lead.id ?? index)}><td><Link className="record-link" href={`/leads/${encodeURIComponent(String(lead.id))}`}>{value(lead, "name")}</Link>{Boolean(lead.archived_at) && <span className="module-status">Archived</span>}</td><td>{value(lead, "company", "company_name")}</td><td>{value(lead, "stage.name", "stage_name")}</td><td>{value(lead, "source")}</td><td className="money-cell">{formatPkr(Number(lead.expected_value_paisa ?? 0))}</td><td>{formatDate(lead.next_follow_up_date)}</td></tr>)}</tbody></table></div><nav className="module-pagination" aria-label="Lead pages"><span>Page {page}</span>{page > 1 && <Link href={href({ page: String(page - 1) })}>Previous</Link>}{hasNext && <Link href={href({ page: String(page + 1) })}>Next</Link>}</nav></> : <div className="module-state">No leads match your filters. <Link href="/leads/new">Add a lead</Link></div>}</ModuleCard> : <div className="pipeline-board leads-board">{columns.length ? columns.map((column, index) => { const stage = record(column.stage ?? column); const leads = Array.isArray(column.leads) ? column.leads.map(record) : []; const stageId = String(stage.id ?? ""); return <section className="pipeline-column" key={stageId || index}><header><span className="stage-dot" style={{ background: String(stage.color ?? "#3b82f6") }} /><strong>{value(stage, "name")}</strong><span className="stage-count">{Number(column.count ?? leads.length)}</span></header><div className="stage-value">{formatPkr(Number(column.total_expected_value_paisa ?? 0))} expected</div>{leads.length ? leads.map(lead => <div key={String(lead.id)} className="lead-board-item"><Link className="lead-card" href={`/leads/${encodeURIComponent(String(lead.id))}`}><strong>{value(lead, "name")}</strong><span>{value(lead, "company", "company_name")}</span><small>{formatPkr(Number(lead.expected_value_paisa ?? 0))} · Follow-up {formatDate(lead.next_follow_up_date)}</small></Link><LeadMoveControl leadId={String(lead.id)} version={Number(lead.version ?? 0)} currentStageId={stageId} stages={stages} /></div>) : <div className="stage-placeholder"><span className="stage-placeholder-icon"><UsersRound size={20} /></span><strong>No leads yet</strong><small>New opportunities will appear here.</small></div>}{Number(column.count ?? leads.length) > leads.length && <Link className="stage-add" href={href({ view: "list", stage_id: stageId, page: "" })}>View all {Number(column.count)} leads</Link>}<Link href={`/leads/new?stage=${encodeURIComponent(stageId)}`} className="stage-add"><Plus size={14} /> Add lead <ArrowRight size={14} /></Link></section>; }) : <ModuleCard><div className="module-state">No pipeline stages are available. <Link href="/settings/pipeline">Manage stages</Link></div></ModuleCard>}</div>}
  </div>;
}
