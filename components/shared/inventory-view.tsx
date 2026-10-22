import Link from "next/link";
import { Suspense } from "react";
import { ArrowDownRight, ArrowUpRight, Boxes, ClipboardList, Package, TriangleAlert } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Mode = "stock" | "low" | "movements";
type Query = { page?: string; search?: string; view?: string; sort?: string };
const pageSize = 20;
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function quantity(value: unknown) { return typeof value === "number" ? new Intl.NumberFormat("en-PK", { maximumFractionDigits: 3 }).format(value) : "—"; }
function low(row: Record<string, unknown>) { return row.low_stock === true || row.is_low === true; }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
function pageHref(mode: Mode, query: Query, page: number) {
  const path = mode === "stock" ? "/inventory" : mode === "low" ? "/inventory/low-stock" : "/inventory/movements";
  const params = new URLSearchParams({ page: String(page) });
  for (const key of ["search", "view", "sort"] as const) if (query[key]) params.set(key, query[key]);
  return `${path}?${params}`;
}
export function InventoryView({ mode, searchParams }: { mode: Mode; searchParams: Promise<Query> }) {
  const title = mode === "stock" ? "Inventory" : mode === "low" ? "Low stock" : "Stock movements";
  return <Suspense fallback={<WorkspaceSkeleton title={title} />}><InventoryContent mode={mode} searchParams={searchParams} /></Suspense>;
}
async function InventoryContent({ mode, searchParams }: { mode: Mode; searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query: Query = {
    page: String(Math.min(10000, Math.max(1, Number.parseInt(raw.page || "1", 10) || 1))),
    search: typeof raw.search === "string" ? raw.search.trim().slice(0, 100) : "",
    view: raw.view === "low" || raw.view === "healthy" ? raw.view : "",
    sort: raw.sort === "name" || raw.sort === "quantity" ? raw.sort : "recent",
  };
  const page = Number(query.page);
  const path = mode === "stock" ? "/inventory" : mode === "low" ? "/inventory/low-stock" : "/inventory/movements";
  let data: unknown = null;
  let organizationName = "WORKSPACE";
  let noOrganization = false;
  let error = "";
  try {
    const workspace = await getWorkspace(path);
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) data = await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query: mode === "low" ? undefined : { page, limit: pageSize, ...(query.search ? { search: query.search } : {}) } });
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to inventory." : cause instanceof Error ? cause.message : "Unable to load inventory."; }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const visible = mode === "stock" ? rows.filter(row => !query.view || (query.view === "low" ? low(row) : !low(row))) : mode === "low" && query.search ? rows.filter(row => `${row.product_name ?? ""} ${row.sku ?? ""}`.toLowerCase().includes(query.search!.toLowerCase())) : rows;
  if (mode === "stock") visible.sort((a, b) => query.sort === "name" ? String(a.product_name ?? a.name ?? "").localeCompare(String(b.product_name ?? b.name ?? "")) : query.sort === "quantity" ? Number(a.on_hand ?? 0) - Number(b.on_hand ?? 0) : String(b.updated_at ?? b.updatedAt ?? "").localeCompare(String(a.updated_at ?? a.updatedAt ?? "")));
  const lowCount = rows.filter(low).length;
  const onHand = rows.reduce((sum, row) => sum + (typeof row.on_hand === "number" ? row.on_hand : 0), 0);
  const hasNext = total === undefined ? rows.length === pageSize : page * pageSize < total;
  const title = mode === "stock" ? "Inventory" : mode === "low" ? "Low stock" : "Stock movements";
  const description = mode === "stock" ? "A clearer view of what is on hand and what needs attention." : mode === "low" ? "Products that may need replenishment soon." : "A history of the changes behind your stock levels.";
  return <div className="inventory-page"><header className="inventory-header"><div><div className="module-eyebrow">{organizationName} / OPERATIONS</div><h1>{title}<span>.</span></h1><p>{description}</p></div>{mode === "stock" ? <a className="inventory-primary" href="#stock-actions">+ Stock action</a> : <Link className="inventory-primary" href="/inventory">Inventory overview</Link>}</header>
    <nav className="inventory-tabs" aria-label="Inventory views"><Link className={mode === "stock" ? "active" : ""} href="/inventory"><Boxes size={16} /> Stock overview</Link><Link className={mode === "low" ? "active" : ""} href="/inventory/low-stock"><TriangleAlert size={16} /> Low stock</Link><Link className={mode === "movements" ? "active" : ""} href="/inventory/movements"><ClipboardList size={16} /> Movements</Link></nav>
    {mode === "stock" ? <section className="inventory-metrics" aria-label="Stock overview"><article><span className="inventory-metric-icon blue"><Package size={19} /></span><div><small>Products found</small><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><p>{total === undefined ? "On this page" : "Inventory records"}</p></div></article><article><span className="inventory-metric-icon teal"><Boxes size={19} /></span><div><small>Units on hand</small><strong>{quantity(onHand)}</strong><p>On this page</p></div></article><article><span className="inventory-metric-icon amber"><TriangleAlert size={19} /></span><div><small>Low stock</small><strong>{lowCount}</strong><p>On this page</p></div></article></section> : <section className="inventory-feature"><div><span className="inventory-kicker">{mode === "low" ? "REPLENISHMENT WATCH" : "STOCK HISTORY"}</span><h2>{mode === "low" ? "Stay ahead of shortages." : "Every change tells a story."}</h2><p>{mode === "low" ? "Review low stock items and take action before they interrupt sales." : "See adjustments, stocktakes, and other movement records in one place."}</p></div><div className="inventory-feature-count"><strong>{total === undefined ? rows.length : total.toLocaleString()}</strong><span>{mode === "low" ? "items to review" : "movement records"}</span></div></section>}
    {mode !== "movements" && <section className="inventory-panel inventory-filter-panel" aria-label="Find stock"><form action={path} method="get" className="inventory-filters"><label className="inventory-search"><span>Search {mode === "low" ? "low stock" : "inventory"}</span><input name="search" type="search" defaultValue={query.search} placeholder="Product name or SKU" /></label>{mode === "stock" && <><label><span>Stock status</span><select name="view" defaultValue={query.view}><option value="">All stock</option><option value="low">Low stock</option><option value="healthy">Not low</option></select></label><label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="recent">Recently updated</option><option value="name">Name A–Z</option><option value="quantity">Lowest quantity</option></select></label></>}<button type="submit">Apply</button>{(query.search || query.view) && <Link href={path} className="inventory-clear">Clear</Link>}</form>{mode === "stock" && <p className="inventory-filter-note">Stock status and sorting refine the current page of results.</p>}</section>}
    <section className="inventory-panel inventory-list" aria-label={`${title} records`}><div className="inventory-list-heading"><div><h2>{mode === "stock" ? "Stock on hand" : title}</h2><p>{total === undefined ? `Page ${page}` : `${total.toLocaleString()} records`} · {visible.length} shown</p></div>{mode === "stock" && <Link href="/inventory/low-stock">Review low stock <ArrowUpRight size={14} /></Link>}</div>
      {error ? <div className="inventory-state" role="alert">{error}</div> : noOrganization ? <div className="inventory-state">Select or create an organization to view inventory.</div> : data === null ? <div className="inventory-state">Inventory data is unavailable.</div> : visible.length === 0 ? <div className="inventory-state"><span className="inventory-state-icon">{mode === "low" ? <TriangleAlert size={27} /> : <Boxes size={27} />}</span><strong>{mode === "low" && !query.search ? "No low stock items" : mode === "movements" ? "No stock movements yet" : query.search || query.view ? "No matching stock" : "Your inventory starts here"}</strong><p>{mode === "low" && !query.search ? "Everything in this view is above its low stock threshold." : mode === "movements" ? "Stock changes will appear here as they happen." : query.search || query.view ? "Try a different search or clear the filters." : "Add products to start monitoring stock."}</p>{(query.search || query.view) && <Link href={path}>Clear filters</Link>}</div> : <div className="inventory-table-wrap"><table className="inventory-table"><thead>{mode === "movements" ? <tr><th>Product</th><th>Movement</th><th>Change</th><th>When</th></tr> : <tr><th>Product</th><th>SKU</th><th>On hand</th><th>{mode === "low" ? "Threshold" : "Available"}</th><th>Stock status</th><th aria-label="Open inventory item" /></tr>}</thead><tbody>{visible.map((row, index) => { const id = typeof row.product_id === "string" ? row.product_id : typeof row.id === "string" && mode !== "movements" ? row.id : ""; const name = label(row.product_name ?? row.name ?? record(row.product).name ?? row.sku); return mode === "movements" ? <tr key={String(row.id ?? index)}><td><div className="inventory-product"><span><Package size={16} /></span><strong>{name}</strong></div></td><td><span className="inventory-movement-type">{label(row.type)}</span></td><td className="inventory-quantity">{typeof row.quantity === "number" ? <span className={row.quantity < 0 ? "negative" : "positive"}>{row.quantity > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{quantity(row.quantity)}</span> : "—"}</td><td>{date(row.created_at)}</td></tr> : <tr key={id || index}><td><div className="inventory-product"><span><Package size={16} /></span><div>{id ? <Link href={`/inventory/${encodeURIComponent(id)}`}>{name}</Link> : <strong>{name}</strong>}<small>{label(record(row.product).name) !== "—" && label(record(row.product).name) !== name ? label(record(row.product).name) : "Stock item"}</small></div></div></td><td className="inventory-sku">{label(row.sku)}</td><td className="inventory-quantity">{quantity(row.on_hand)}</td><td className="inventory-quantity">{quantity(mode === "low" ? row.low_stock_level : row.available)}</td><td><span className={`inventory-stock-badge ${mode === "low" || low(row) ? "attention" : "healthy"}`}><span />{mode === "low" || low(row) ? "Low stock" : "In stock"}</span></td><td>{id && <Link className="inventory-view" href={`/inventory/${encodeURIComponent(id)}`}>View <ArrowUpRight size={14} /></Link>}</td></tr>; })}</tbody></table></div>}
    </section>
    {mode !== "low" && data !== null && rows.length > 0 && <nav className="pagination" aria-label="Inventory pages"><span>Page {page}{total !== undefined ? ` · ${total.toLocaleString()} records` : ""}</span><div>{page > 1 && <Link href={pageHref(mode, query, page - 1)}>Previous</Link>}{hasNext && <Link href={pageHref(mode, query, page + 1)}>Next</Link>}</div></nav>}
    {mode === "stock" && <section id="stock-actions" className="inventory-actions"><div className="inventory-actions-heading"><span className="inventory-kicker">KEEP STOCK ACCURATE</span><h2>Stock actions</h2><p>Adjust quantities or record a counted stocktake.</p></div><div><OperationForm operationId="inventory.adjust" /><OperationForm operationId="inventory.stocktake" /></div></section>}
  </div>;
}
