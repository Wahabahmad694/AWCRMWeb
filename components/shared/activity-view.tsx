import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, MessageSquareText, Phone, StickyNote } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Mode = "activities" | "reminders";
type Query = { page?: string; search?: string; type?: string; view?: string };
const pageSize = 20;
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
}
function isOverdue(row: Record<string, unknown>) {
  const due = typeof row.due_at === "string" ? new Date(row.due_at).getTime() : NaN;
  return Number.isFinite(due) && due < Date.now() && row.completed !== true && String(row.status ?? "").toLowerCase() !== "completed";
}
function pageHref(mode: Mode, query: Query, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  for (const key of ["search", "type", "view"] as const) if (query[key]) params.set(key, query[key]);
  return `${mode === "activities" ? "/activities" : "/activities/reminders"}?${params}`;
}
function kindIcon(type: unknown) {
  switch (String(type ?? "").toLowerCase()) {
    case "call": return Phone;
    case "follow_up": return CalendarClock;
    case "note": return StickyNote;
    default: return MessageSquareText;
  }
}
export function ActivityView({ mode, searchParams }: { mode: Mode; searchParams: Promise<Query> }) {
  return <Suspense fallback={<WorkspaceSkeleton title={mode === "activities" ? "Activities" : "Reminders"} />}><ActivityContent mode={mode} searchParams={searchParams} /></Suspense>;
}
async function ActivityContent({ mode, searchParams }: { mode: Mode; searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    type: ["note", "call", "meeting", "follow_up", "whatsapp", "email"].includes(raw.type || "") ? raw.type : "",
    view: ["open", "completed", "overdue"].includes(raw.view || "") ? raw.view : "",
  };
  const page = Number(query.page);
  const path = mode === "activities" ? "/activities" : "/reminders";
  const browserPath = mode === "activities" ? "/activities" : "/activities/reminders";
  let rows: Record<string, unknown>[] = [];
  let data: unknown = null;
  let error = "";
  let noOrganization = false;
  let organizationName = "WORKSPACE";
  try {
    const workspace = await getWorkspace(browserPath);
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) { data = await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: pageSize } }); rows = items(data); }
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to this area." : cause instanceof Error ? cause.message : "Unable to load records."; }
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const visible = rows.filter(row => {
    const title = String(row.title ?? row.subject ?? row.body ?? row.content ?? row.note ?? "");
    if (query.search && !title.toLowerCase().includes(query.search.toLowerCase())) return false;
    if (mode === "activities" && query.type && row.type !== query.type) return false;
    if (query.view === "overdue") return isOverdue(row);
    const completed = row.completed === true || String(row.status ?? "").toLowerCase() === "completed";
    return !query.view || (query.view === "completed" ? completed : !completed);
  });
  const overdue = rows.filter(isOverdue).length;
  const completed = rows.filter(row => row.completed === true || String(row.status ?? "").toLowerCase() === "completed").length;
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const title = mode === "activities" ? "Activities" : "Reminders";
  const filtered = Boolean(query.search || query.type || query.view);
  return <div className="activity-page"><header className="activity-header"><div><div className="module-eyebrow">{organizationName} / WORKFLOW</div><h1>{title}<span>.</span></h1><p>{mode === "activities" ? "Keep every conversation and follow-up moving." : "Stay on top of what needs your attention next."}</p></div><a href="#activity-actions" className="activity-primary">+ {mode === "activities" ? "Add activity" : "Add reminder"}</a></header>
    <nav className="activity-tabs" aria-label="Activity views"><Link href="/activities" className={mode === "activities" ? "active" : ""}><Activity size={16} /> Activity feed</Link><Link href="/activities/reminders" className={mode === "reminders" ? "active" : ""}><CalendarClock size={16} /> Reminders</Link><Link href="/activities/contact-log"><MessageSquareText size={16} /> WhatsApp log</Link></nav>
    <section className="activity-overview" aria-label={`${title} overview`}><article><span className="activity-metric-icon blue"><Activity size={18} /></span><div><small>{mode === "activities" ? "Activities found" : "Reminders found"}</small><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><p>{total === undefined ? "On this page" : "In your workspace"}</p></div></article><article><span className="activity-metric-icon amber"><Clock3 size={18} /></span><div><small>Overdue</small><strong>{overdue}</strong><p>On this page</p></div></article><article><span className="activity-metric-icon teal"><CheckCircle2 size={18} /></span><div><small>Completed</small><strong>{completed}</strong><p>On this page</p></div></article></section>
    <section className="activity-panel activity-filter-panel" aria-label={`Filter ${title.toLowerCase()}`}><form action={browserPath} method="get" className="activity-filters"><label className="activity-search"><span>Search this page</span><input type="search" name="search" defaultValue={query.search} placeholder="Subject or details" /></label>{mode === "activities" && <label><span>Type</span><select name="type" defaultValue={query.type}><option value="">All types</option>{["note", "call", "meeting", "follow_up", "whatsapp", "email"].map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>}<label><span>Status</span><select name="view" defaultValue={query.view}><option value="">All</option><option value="open">Open</option><option value="completed">Completed</option><option value="overdue">Overdue</option></select></label><button type="submit">Apply</button>{filtered && <Link className="activity-clear" href={browserPath}>Clear</Link>}</form><p>Search and filters refine the current page of results.</p></section>
    <section className="activity-panel activity-feed" aria-label={`${title} records`}><div className="activity-feed-heading"><div><h2>{mode === "activities" ? "Recent activity" : "Follow-up schedule"}</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {visible.length} shown</p></div><span>{mode === "activities" ? "ACTIVITY LOG" : "REMINDER LIST"}</span></div>
      {error ? <div className="activity-state" role="alert">{error}</div> : noOrganization ? <div className="activity-state">Select or create an organization to view {title.toLowerCase()}.</div> : data === null ? <div className="activity-state">{title} data is unavailable.</div> : visible.length === 0 ? <div className="activity-state"><span className="activity-state-icon"><CalendarClock size={27} /></span><strong>{filtered ? "No matching records" : mode === "activities" ? "Your activity feed starts here" : "All caught up"}</strong><p>{filtered ? "Try another search or clear the filters." : mode === "activities" ? "Record an activity to keep customer work in context." : "Add a reminder to plan your next follow-up."}</p>{filtered && <Link href={browserPath}>Clear filters</Link>}</div> : <div className="activity-feed-list">{visible.map((row, index) => { const id = typeof row.id === "string" ? row.id : ""; const subject = label(row.title ?? row.subject ?? row.body ?? row.content ?? row.note); const Icon = mode === "reminders" ? CalendarClock : kindIcon(row.type); const due = date(row.due_at); const overdueItem = isOverdue(row); const complete = row.completed === true || String(row.status ?? "").toLowerCase() === "completed"; return <article className="activity-item" key={id || index}><span className={`activity-item-icon ${overdueItem ? "overdue" : ""}`}><Icon size={18} /></span><div className="activity-item-content"><div className="activity-item-top">{mode === "activities" && id ? <Link href={`/activities/${encodeURIComponent(id)}`}>{subject}</Link> : <strong>{subject}</strong>}<span className={`activity-type ${overdueItem ? "overdue" : ""}`}>{mode === "reminders" ? "Reminder" : label(row.type).replaceAll("_", " ")}</span></div>{label(row.body) !== "—" && label(row.body) !== subject && <p>{label(row.body)}</p>}<div className="activity-item-meta"><span><CalendarClock size={13} /> {due === "—" ? "No due date" : due}</span>{typeof row.customer_id === "string" && <Link href={`/customers/${encodeURIComponent(row.customer_id)}`}>Customer <ArrowUpRight size={12} /></Link>}{typeof row.order_id === "string" && <Link href={`/orders/${encodeURIComponent(row.order_id)}`}>Order <ArrowUpRight size={12} /></Link>}</div></div><div className="activity-item-side">{overdueItem ? <span className="activity-overdue">Overdue</span> : complete ? <StatusBadge value="completed" /> : mode === "activities" && row.status ? <StatusBadge value={String(row.status)} /> : <span className="activity-open">Open</span>}{mode === "reminders" && id && <OperationForm operationId="reminder.update" entityId={id} defaults={row} />}{mode === "activities" && id && <Link href={`/activities/${encodeURIComponent(id)}`}>Details <ArrowUpRight size={13} /></Link>}</div></article>; })}</div>}
    </section>
    {data !== null && rows.length > 0 && <nav className="pagination" aria-label={`${title} pages`}><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={pageHref(mode, query, page - 1)}>Previous</Link>}{hasNext && <Link href={pageHref(mode, query, page + 1)}>Next</Link>}</div></nav>}
    <section id="activity-actions" className="activity-actions"><div className="activity-actions-heading"><span>PLAN THE NEXT STEP</span><h2>{mode === "activities" ? "Keep the conversation going" : "Create a follow-up"}</h2><p>{mode === "activities" ? "Record an interaction or set a reminder for later." : "Add a reminder with a clear due date and context."}</p></div><div>{mode === "activities" && <OperationForm operationId="activity.create" defaultOpen /> }<OperationForm operationId="reminder.create" defaultOpen={mode === "reminders"} /></div></section>
  </div>;
}
