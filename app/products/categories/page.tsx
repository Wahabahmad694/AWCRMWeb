import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, FolderOpen, Layers3, Package } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
export default function ProductCategoriesPage() {
  return <Suspense fallback={<WorkspaceSkeleton title="Product categories" />}><CategoriesContent /></Suspense>;
}
async function CategoriesContent() {
  let rows: Record<string, unknown>[] = [];
  let error = "";
  let noOrganization = false;
  let organizationName = "WORKSPACE";
  try {
    const workspace = await getWorkspace("/products/categories");
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) rows = items(await apiRequest("/product-categories", { token: workspace.token, organizationId: workspace.organizationId }));
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to product categories." : cause instanceof Error ? cause.message : "Unable to load categories."; }
  return <div className="catalog-page catalog-categories-page"><header className="catalog-header"><div><div className="module-eyebrow">{organizationName} / CATALOG</div><h1>Product categories<span>.</span></h1><p>Give every item a place in a catalog that is easy to browse.</p></div><div className="catalog-header-actions"><Link href="/products" className="catalog-secondary"><ArrowLeft size={16} /> Products</Link><a href="#add-category" className="catalog-primary">+ Add category</a></div></header>
    <section className="catalog-category-hero"><div><span className="catalog-hero-icon"><Layers3 size={24} /></span><span className="catalog-kicker">CATALOG ORGANIZATION</span><h2>Make your catalog easier to navigate.</h2><p>Categories group related products and services so your team can find what they need faster.</p><Link href="/products">Explore products <ArrowUpRight size={15} /></Link></div><div className="catalog-category-count"><strong>{rows.length}</strong><span>{rows.length === 1 ? "category" : "categories"}</span><small>In your workspace</small></div></section>
    <section className="catalog-category-section"><div className="catalog-category-heading"><div><span className="catalog-kicker">YOUR CATEGORIES</span><h2>Category library</h2><p>Manage the structure behind your product catalog.</p></div><span>{rows.length} total</span></div>
      {error ? <div className="catalog-panel catalog-state" role="alert">{error}</div> : noOrganization ? <div className="catalog-panel catalog-state">Select or create an organization to view categories.</div> : rows.length === 0 ? <div className="catalog-panel catalog-state"><span className="catalog-state-icon"><FolderOpen size={28} /></span><strong>Your categories start here</strong><p>Add your first category to organize products and services.</p><a href="#add-category">Add a category <ArrowUpRight size={14} /></a></div> : <div className="catalog-category-grid">{rows.map((row, index) => <article className="catalog-panel catalog-category-card" key={String(row.id ?? index)}><div className="catalog-category-card-top"><span><FolderOpen size={21} /></span><span className="catalog-category-index">{String(index + 1).padStart(2, "0")}</span></div><h3>{label(row.name)}</h3><p>{label(row.description) === "—" ? "A home for related catalog items." : label(row.description)}</p><div className="catalog-category-card-actions">{typeof row.id === "string" && <><OperationForm operationId="category.product.update" entityId={row.id} defaults={row} /><OperationForm operationId="category.product.delete" entityId={row.id} defaults={row} /></>}</div></article>)}</div>}
    </section><div id="add-category" className="catalog-create"><OperationForm operationId="category.product.create" defaultOpen /></div>
    <div className="catalog-category-footer"><Package size={18} /><span>Ready to add items?</span><Link href="/products">Go to products <ArrowUpRight size={14} /></Link></div>
  </div>;
}
