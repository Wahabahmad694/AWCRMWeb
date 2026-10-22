import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Boxes, Layers3, Package, Tag } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Query = { page?: string; search?: string; type?: string; status?: string; sort?: string };
const pageSize = 20;
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function money(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "—"; }
function pageHref(query: Query, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  for (const key of ["search", "type", "status", "sort"] as const) if (query[key]) params.set(key, query[key]);
  return `/products?${params}`;
}
export default function ProductsPage({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Products" />}><ProductsContent searchParams={searchParams} /></Suspense>;
}
async function ProductsContent({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    type: raw.type === "product" || raw.type === "service" ? raw.type : "",
    status: raw.status === "active" || raw.status === "inactive" ? raw.status : "",
    sort: raw.sort === "name" || raw.sort === "price" ? raw.sort : "recent",
  };
  const page = Number(query.page);
  let data: unknown = null;
  let organizationName = "WORKSPACE";
  let error = "";
  let noOrganization = false;
  try {
    const workspace = await getWorkspace("/products");
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) data = await apiRequest("/products", { token: workspace.token, organizationId: workspace.organizationId, query: { page, limit: pageSize, ...(query.search ? { search: query.search } : {}) } });
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to products." : cause instanceof Error ? cause.message : "Unable to load products."; }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const visible = rows.filter(row => (!query.type || String(row.type ?? "").toLowerCase() === query.type) && (!query.status || String(row.status ?? "active").toLowerCase() === query.status)).sort((a, b) => {
    if (query.sort === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    if (query.sort === "price") return Number(b.price_paisa ?? 0) - Number(a.price_paisa ?? 0);
    return String(b.created_at ?? b.createdAt ?? "").localeCompare(String(a.created_at ?? a.createdAt ?? ""));
  });
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const filtered = Boolean(query.search || query.type || query.status);
  return <div className="catalog-page">
    <header className="catalog-header"><div><div className="module-eyebrow">{organizationName} / CATALOG</div><h1>Products<span>.</span></h1><p>Keep your products, services, and pricing organized.</p></div><div className="catalog-header-actions"><Link href="/products/categories" className="catalog-secondary"><Layers3 size={16} /> Categories</Link><a href="#add-product" className="catalog-primary">+ Add product</a></div></header>
    <section className="catalog-overview" aria-label="Product overview"><article><span className="catalog-metric-icon blue"><Package size={19} /></span><div><small>Products found</small><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><p>{total === undefined ? "On this page" : "In your catalog"}</p></div></article><article><span className="catalog-metric-icon teal"><Boxes size={19} /></span><div><small>Showing now</small><strong>{visible.length}</strong><p>{query.type || query.status ? "Matching page filters" : `Page ${page}`}</p></div></article><article><span className="catalog-metric-icon violet"><Tag size={19} /></span><div><small>Services shown</small><strong>{visible.filter(row => row.type === "service").length}</strong><p>On this page</p></div></article></section>
    <section className="catalog-panel catalog-filter-panel" aria-label="Find products"><form action="/products" method="get" className="catalog-filters"><label className="catalog-search"><span>Search catalog</span><input type="search" name="search" defaultValue={query.search} placeholder="Product name or SKU" /></label><label><span>Type</span><select name="type" defaultValue={query.type}><option value="">All types</option><option value="product">Products</option><option value="service">Services</option></select></label><label><span>Status</span><select name="status" defaultValue={query.status}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="recent">Recently added</option><option value="name">Name A–Z</option><option value="price">Highest price</option></select></label><button type="submit">Apply</button>{filtered && <Link href="/products" className="catalog-clear">Clear</Link>}</form><p className="catalog-filter-note">Type, status, and sort refine the current page of results.</p></section>
    <section className="catalog-panel catalog-list" aria-label="Product records"><div className="catalog-list-heading"><div><h2>Product catalog</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {visible.length} shown</p></div><Link href="/products/categories">Manage categories <ArrowUpRight size={14} /></Link></div>
      {error ? <div className="catalog-state" role="alert">{error}</div> : noOrganization ? <div className="catalog-state">Select or create an organization to view products.</div> : data === null ? <div className="catalog-state">Product data is unavailable.</div> : visible.length === 0 ? <div className="catalog-state"><span className="catalog-state-icon"><Package size={27} /></span><strong>{filtered ? "No matching products" : "Your catalog starts here"}</strong><p>{filtered ? "Try another search or clear the filters." : "Add your first product or service to build your catalog."}</p>{filtered && <Link href="/products">Clear filters</Link>}</div> : <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Product</th><th>SKU</th><th>Type</th><th>Unit</th><th>Price</th><th>Status</th><th aria-label="Open product" /></tr></thead><tbody>{visible.map((row, index) => { const id = typeof row.id === "string" ? row.id : ""; const name = label(row.name); return <tr key={id || index}><td><div className="catalog-product"><span><Package size={17} /></span><div>{id ? <Link href={`/products/${encodeURIComponent(id)}`}>{name}</Link> : <strong>{name}</strong>}<small>{label(row.description) !== "—" ? label(row.description) : "Catalog item"}</small></div></div></td><td className="catalog-sku">{label(row.sku)}</td><td><span className="catalog-type">{label(row.type)}</span></td><td>{label(row.unit)}</td><td className="catalog-price">{money(row.price_paisa)}</td><td><StatusBadge value={String(row.status ?? "active")} /></td><td>{id && <Link className="catalog-view" href={`/products/${encodeURIComponent(id)}`} aria-label={`View ${name}`}>View <ArrowUpRight size={14} /></Link>}</td></tr>; })}</tbody></table></div>}
    </section>
    {data !== null && rows.length > 0 && <nav className="pagination" aria-label="Product pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={pageHref(query, page - 1)}>Previous</Link>}{hasNext && <Link href={pageHref(query, page + 1)}>Next</Link>}</div></nav>}
    <div id="add-product" className="catalog-create"><OperationForm operationId="product.create" defaultOpen /></div>
  </div>;
}
