import Link from "next/link";
import { Suspense } from "react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Query = { page?: string; search?: string; type?: string; status?: string; sort?: string };
const pageSize = 20;

function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function money(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "—"; }
function initials(value: unknown) {
  return label(value).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
function href(query: Query, page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  for (const key of ["search", "type", "status", "sort"] as const) if (query[key]) params.set(key, query[key]);
  return `/customers?${params}`;
}

export default function CustomersPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Customers" />}><CustomerDirectory searchParams={searchParams} /></Suspense>;
}

async function CustomerDirectory({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    type: raw.type === "customer" || raw.type === "lead" ? raw.type : "",
    status: raw.status === "active" || raw.status === "archived" ? raw.status : "",
    sort: raw.sort === "name" || raw.sort === "recent" ? raw.sort : "recent",
  };
  const page = Number(query.page);
  let data: unknown = null;
  let organizationName = "WORKSPACE";
  let errorMessage = "";
  let noOrganization = false;
  try {
    const workspace = await getWorkspace("/customers");
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) data = await apiRequest("/customers", { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: pageSize, ...(query.search ? { search: query.search } : {}) } });
  } catch (error) {
    errorMessage = error instanceof ApiError && error.status === 403 ? "Your role does not have access to customers." : error instanceof Error ? error.message : "Unable to load customers.";
  }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const visible = rows.filter(row => (!query.type || row.type === query.type) && (!query.status || String(row.status ?? "active").toLowerCase() === query.status)).sort((a, b) => {
    if (query.sort === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    return String(b.created_at ?? b.createdAt ?? "").localeCompare(String(a.created_at ?? a.createdAt ?? ""));
  });
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const currentFilters = Boolean(query.search || query.type || query.status);
  return <div className="customer-page">
    <div className="customer-heading"><div><div className="module-eyebrow">{organizationName} / RELATIONSHIPS</div><h1>Customer directory</h1><p>Find customer details, follow relationships, and keep contact information close.</p></div><div className="customer-heading-actions"><a href="#add-customer" className="module-primary">+ Add customer</a></div></div>
    <section className="customer-overview" aria-label="Directory overview">
      <div><span>Customers found</span><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><small>{total === undefined ? "On this page" : query.search ? "Matching search" : "Across your directory"}</small></div>
      <div><span>Showing</span><strong>{visible.length}</strong><small>{query.type || query.status ? "Matching page filters" : `Page ${page}`}</small></div>
      <div><span>Contact shortcuts</span><strong>{visible.filter(row => row.phone || row.email).length}</strong><small>On this page</small></div>
    </section>
    <section className="customer-card" aria-label="Search and filter customers"><form action="/customers" method="get" className="customer-filters">
      <label className="customer-search"><span>Search directory</span><input name="search" type="search" defaultValue={query.search} placeholder="Name, business, phone or email" /></label>
      <label><span>Relationship</span><select name="type" defaultValue={query.type}><option value="">All types</option><option value="customer">Customers</option><option value="lead">Leads</option></select></label>
      <label><span>Status</span><select name="status" defaultValue={query.status}><option value="">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
      <label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="recent">Recently added</option><option value="name">Name A–Z</option></select></label>
      <button type="submit">Apply</button>{currentFilters && <Link href="/customers" className="customer-clear">Clear</Link>}
    </form><p className="customer-filter-note">Type, status, and sort refine the current page of results.</p></section>
    <section className="customer-card customer-results" aria-label="Customer records"><div className="customer-results-heading"><div><h2>All relationships</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} total records`} · {visible.length} shown</p></div></div>
      {errorMessage ? <div className="customer-state" role="alert">{errorMessage}</div> : noOrganization ? <div className="customer-state">Select or create an organization to view customers.</div> : !data ? <div className="customer-state">Customer data is unavailable.</div> : visible.length === 0 ? <div className="customer-state"><strong>{currentFilters ? "No matching customers" : "Your directory is ready"}</strong><p>{currentFilters ? "Try another search or clear the filters." : "Add your first customer to start building your directory."}</p>{currentFilters && <Link href="/customers">Clear filters</Link>}</div> : <div className="customer-table-scroll"><table className="customer-table"><thead><tr><th>Customer</th><th>Contact</th><th>Location</th><th>Type</th><th>Status</th><th>Balance</th><th aria-label="Open customer" /></tr></thead><tbody>{visible.map((row, index) => {
        const id = typeof row.id === "string" ? row.id : "";
        const name = label(row.name);
        const phone = label(row.phone);
        const email = label(row.email);
        const city = label(row.city);
        const area = label(row.area);
        const balance = row.balance_paisa ?? row.outstanding_balance_paisa ?? row.current_balance_paisa;
        return <tr key={id || index}><td><div className="customer-identity"><span className="customer-avatar" aria-hidden="true">{initials(name)}</span><div>{id ? <Link className="customer-name" href={`/customers/${encodeURIComponent(id)}`}>{name}</Link> : <strong>{name}</strong>}<small>{label(row.business_name) !== "—" ? label(row.business_name) : label(row.code)}</small></div></div></td><td><div className="customer-contact">{phone !== "—" ? <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}>{phone}</a> : <span>—</span>}{email !== "—" && <a href={`mailto:${email}`}>{email}</a>}</div></td><td>{city}{area !== "—" && <small className="customer-subline">{area}</small>}</td><td><span className="customer-type">{label(row.type)}</span></td><td><StatusBadge value={String(row.status ?? "active")} /></td><td className="customer-money">{money(balance)}</td><td>{id && <Link className="customer-open" href={`/customers/${encodeURIComponent(id)}`} aria-label={`View ${name}`}>View →</Link>}</td></tr>;
      })}</tbody></table></div>}
    </section>
    {data !== null && rows.length > 0 && <nav className="pagination" aria-label="Customer pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={href(query, page - 1)}>Previous</Link>}{hasNext && <Link href={href(query, page + 1)}>Next</Link>}</div></nav>}
    <div id="add-customer" className="customer-add"><OperationForm operationId="customer.create" defaultOpen /></div>
  </div>;
}
