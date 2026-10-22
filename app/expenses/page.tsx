import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, CalendarDays, FolderOpen, ReceiptText, Wallet } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { ExpenseCreateForm } from "@/components/shared/expense-create-form";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Query = { page?: string; search?: string; category?: string; status?: string; sort?: string };
const pageSize = 20;
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function money(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "—"; }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
function pageHref(query: Query, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  for (const key of ["search", "category", "status", "sort"] as const) if (query[key]) params.set(key, query[key]);
  return `/expenses?${params}`;
}
export default function ExpensesPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Expenses" />}><ExpensesContent searchParams={searchParams} /></Suspense>;
}
async function ExpensesContent({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    category: typeof raw.category === "string" ? raw.category : "",
    status: raw.status === "posted" || raw.status === "void" || raw.status === "voided" ? raw.status : "",
    sort: raw.sort === "oldest" || raw.sort === "amount" ? raw.sort : "recent",
  };
  const page = Number(query.page);
  let organizationName = "WORKSPACE";
  let noOrganization = false;
  let expenseError = "";
  let categoryError = "";
  let data: unknown = null;
  let categories: { id: string; name: string }[] = [];
  try {
    const workspace = await getWorkspace("/expenses");
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) {
      const [expenseResult, categoryResult] = await Promise.allSettled([
        apiRequest("/expenses", { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: pageSize } }),
        apiRequest("/expense-categories", { token: workspace.token, organizationId: workspace.organizationId }),
      ]);
      if (expenseResult.status === "fulfilled") data = expenseResult.value;
      else expenseError = expenseResult.reason instanceof ApiError ? expenseResult.reason.message : "Unable to load expenses.";
      if (categoryResult.status === "fulfilled") categories = items(categoryResult.value).filter(item => typeof item.id === "string" && typeof item.name === "string").map(item => ({ id: String(item.id), name: String(item.name) }));
      else categoryError = categoryResult.reason instanceof ApiError ? categoryResult.reason.message : "Unable to load categories.";
    }
  } catch (cause) { expenseError = cause instanceof ApiError ? cause.message : "Unable to load your workspace."; }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const names = new Map(categories.map(category => [category.id, category.name]));
  if (!categories.some(category => category.id === query.category)) query.category = "";
  const visible = rows.filter(row => {
    const categoryName = label(row.category_name) !== "—" ? label(row.category_name) : names.get(String(row.category_id ?? "")) ?? "";
    const content = `${row.description ?? ""} ${categoryName} ${row.receipt_reference ?? ""}`.toLowerCase();
    return (!query.search || content.includes(query.search.toLowerCase())) && (!query.category || row.category_id === query.category) && (!query.status || String(row.status ?? "").toLowerCase() === query.status);
  }).sort((a, b) => {
    if (query.sort === "amount") return Number(b.amount_paisa ?? 0) - Number(a.amount_paisa ?? 0);
    const comparison = String(b.expense_date ?? b.created_at ?? "").localeCompare(String(a.expense_date ?? a.created_at ?? ""));
    return query.sort === "oldest" ? -comparison : comparison;
  });
  const shownAmount = visible.reduce((sum, row) => sum + (typeof row.amount_paisa === "number" ? row.amount_paisa : 0), 0);
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const filtered = Boolean(query.search || query.category || query.status);
  return <div className="expense-page"><header className="expense-header"><div><div className="module-eyebrow">{organizationName} / FINANCE</div><h1>Expenses<span>.</span></h1><p>Capture spending clearly and keep every cost in context.</p></div><div><Link href="/expenses/categories" className="expense-secondary"><FolderOpen size={16} /> Categories</Link><a href="#add-expense" className="expense-primary">+ Add expense</a></div></header>
    <section className="expense-metrics" aria-label="Expense overview"><article><span className="expense-metric-icon blue"><ReceiptText size={19} /></span><div><small>Expenses found</small><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><p>{total === undefined ? "On this page" : "Across your workspace"}</p></div></article><article><span className="expense-metric-icon orange"><Wallet size={19} /></span><div><small>Shown spending</small><strong>{money(shownAmount)}</strong><p>Current page and filters</p></div></article><article><span className="expense-metric-icon teal"><FolderOpen size={19} /></span><div><small>Categories</small><strong>{categories.length}</strong><p>Available to choose</p></div></article></section>
    <div className="expense-main"><ExpenseCreateForm categories={categories} categoryError={categoryError} /><aside className="expense-side"><section className="expense-side-card"><span className="expense-side-icon"><FolderOpen size={20} /></span><h2>Organize every cost</h2><p>Use categories to make spending easier to review in reports.</p>{categoryError ? <p role="alert" className="expense-side-error">{categoryError}</p> : categories.length ? <div className="expense-category-chips">{categories.slice(0, 6).map(category => <span key={category.id}>{category.name}</span>)}</div> : <p className="expense-side-empty">No categories yet. Add your first one below.</p>}<Link href="/expenses/categories">Manage categories <ArrowUpRight size={15} /></Link></section><div className="expense-category-create"><OperationForm operationId="category.expense.create" /></div></aside></div>
    <section className="expense-list-card" aria-label="Expense records"><div className="expense-list-header"><div><span>SPENDING LOG</span><h2>Recent expenses</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {visible.length} shown</p></div><span>Values in PKR</span></div><form action="/expenses" method="get" className="expense-filters"><label className="expense-search"><span>Search this page</span><input name="search" type="search" defaultValue={query.search} placeholder="Description, category, or receipt" /></label><label><span>Category</span><select name="category" defaultValue={query.category}><option value="">All categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span>Status</span><select name="status" defaultValue={query.status}><option value="">All statuses</option><option value="posted">Posted</option><option value="void">Void</option><option value="voided">Voided</option></select></label><label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="recent">Most recent</option><option value="oldest">Oldest first</option><option value="amount">Highest amount</option></select></label><button type="submit">Apply</button>{filtered && <Link href="/expenses">Clear</Link>}</form><p className="expense-filter-note">Search, category, status, and sort refine the current page of results.</p>
      {expenseError ? <div className="expense-state" role="alert">{expenseError}</div> : noOrganization ? <div className="expense-state">Select or create an organization to view expenses.</div> : data === null ? <div className="expense-state">Expense data is unavailable.</div> : visible.length === 0 ? <div className="expense-state"><span><ReceiptText size={27} /></span><strong>{filtered ? "No matching expenses" : "Your spending log starts here"}</strong><p>{filtered ? "Try different filters or clear them." : "Record an expense to see it here."}</p>{filtered && <Link href="/expenses">Clear filters</Link>}</div> : <div className="expense-table-wrap"><table className="expense-table"><thead><tr><th>Expense</th><th>Category</th><th>Date</th><th>Method</th><th>Status</th><th>Amount</th><th aria-label="Open expense" /></tr></thead><tbody>{visible.map((row, index) => { const id = typeof row.id === "string" ? row.id : ""; const description = label(row.description) !== "—" ? label(row.description) : "Expense"; const categoryName = label(row.category_name) !== "—" ? label(row.category_name) : names.get(String(row.category_id ?? "")) ?? "—"; return <tr key={id || index}><td><div className="expense-row-identity"><span><ReceiptText size={16} /></span><div>{id ? <Link href={`/expenses/${encodeURIComponent(id)}`}>{description}</Link> : <strong>{description}</strong>}<small>{label(row.receipt_reference) !== "—" ? `Ref: ${label(row.receipt_reference)}` : "Business expense"}</small></div></div></td><td><span className="expense-row-category">{categoryName}</span></td><td><span className="expense-row-date"><CalendarDays size={13} /> {date(row.expense_date)}</span></td><td className="expense-method">{label(row.method).replaceAll("_", " ")}</td><td><StatusBadge value={String(row.status ?? "—")} /></td><td className="expense-row-amount">{money(row.amount_paisa)}</td><td>{id && <Link href={`/expenses/${encodeURIComponent(id)}`} className="expense-row-view">View <ArrowUpRight size={14} /></Link>}</td></tr>; })}</tbody></table></div>}
    </section>{data !== null && rows.length > 0 && <nav className="pagination" aria-label="Expense pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={pageHref(query, page - 1)}>Previous</Link>}{hasNext && <Link href={pageHref(query, page + 1)}>Next</Link>}</div></nav>}
  </div>;
}
