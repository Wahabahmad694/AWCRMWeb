import Link from "next/link";
import { Suspense } from "react";
import { Archive, ArrowLeft, Boxes, CircleDollarSign, Package, RotateCcw, ShieldAlert, Tag, Trash2 } from "lucide-react";
import { OperationForm } from "@/components/shared/operation-form";
import { ApiError, apiRequest, getWorkspace, items, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

type Props = { params: Promise<{ id: string }> };
const display = (value: unknown) => typeof value === "string" && value.trim() ? value : "—";
const money = (value: unknown) => typeof value === "number" ? formatPaisa(value) : "—";

export default function ProductDetailPage({ params }: Props) {
  return <Suspense fallback={<div className="product-detail-page" role="status" aria-label="Loading product"><div className="module-list-skeleton"><div /><div /><div /></div></div>}><ProductDetailContent params={params} /></Suspense>;
}

async function ProductDetailContent({ params }: Props) {
  const { id } = await params;
  let product: Record<string, unknown> = {};
  let categoryOptions: { value: string; label: string }[] = [];
  let error = "";
  try {
    const workspace = await getWorkspace(`/products/${encodeURIComponent(id)}`);
    if (!workspace.organizationId) error = "Select an organization to view this product.";
    else {
      const [productResult, categoryResult] = await Promise.allSettled([
        apiRequest(`/products/${encodeURIComponent(id)}`, { token: workspace.token, organizationId: workspace.organizationId }),
        apiRequest("/product-categories", { token: workspace.token, organizationId: workspace.organizationId, query: { page: 1, limit: 100 } }),
      ]);
      if (productResult.status === "fulfilled") product = unwrap(productResult.value);
      else error = productResult.reason instanceof ApiError ? productResult.reason.message : "Unable to load this product.";
      if (categoryResult.status === "fulfilled") categoryOptions = items(categoryResult.value)
        .filter(row => typeof row.id === "string" && typeof row.name === "string")
        .map(row => ({ value: String(row.id), label: String(row.name) }));
    }
  } catch (cause) { if (!(cause instanceof ApiError)) throw cause; error = cause.message; }
  const archived = product.status === "archived" || Boolean(product.archived_at);
  const name = display(product.name) === "—" ? "Product" : String(product.name);
  const category = categoryOptions.find(option => option.value === product.category_id)?.label ?? display(product.category_name);

  return <div className="product-detail-page">
    <Link href="/products" className="product-detail-back"><ArrowLeft size={16} /> Back to products</Link>
    <header className="product-detail-hero"><div className="product-detail-symbol"><Package size={27} /></div><div className="product-detail-title"><span>PRODUCT CATALOG / DETAILS</span><h1>{name}</h1><p>{display(product.sku) === "—" ? "No SKU" : `SKU ${product.sku}`} <span>·</span> {archived ? "Archived product" : "Active product"}</p></div><span className={`product-detail-status ${archived ? "archived" : ""}`}>{archived ? "Archived" : "Active"}</span></header>
    {error ? <div className="product-detail-error" role="alert">{error}</div> : <>
      <section className="product-detail-stats" aria-label="Product overview"><article><span><CircleDollarSign size={18} /></span><div><small>Selling price</small><strong>{money(product.price_paisa)}</strong></div></article><article><span><Tag size={18} /></span><div><small>Category</small><strong>{category}</strong></div></article><article><span><Boxes size={18} /></span><div><small>Low stock alert</small><strong>{display(product.low_stock_level)}</strong></div></article></section>
      {Boolean(product.description) && <section className="product-detail-description"><h2>About this product</h2><p>{String(product.description)}</p></section>}
      <div className="product-detail-workspace"><section className="product-detail-edit"><div className="product-detail-section-head"><div><span>CATALOG SETTINGS</span><h2>Edit product</h2><p>Update product information. Stock quantities are managed in Inventory.</p></div></div><OperationForm operationId="product.update" entityId={id} defaults={product} defaultOpen selectOptions={categoryOptions.length ? { category_id: categoryOptions } : {}} /></section>
      <aside className="product-detail-side"><section className="product-detail-actions"><div className="product-detail-side-head"><ShieldAlert size={18} /><div><h2>Product actions</h2><p>Manage this product’s availability.</p></div></div>{archived ? <div className="product-action-item"><span><RotateCcw size={18} /></span><div><strong>Restore product</strong><p>Make this product active again.</p></div><OperationForm operationId="product.restore" entityId={id} defaults={product} /></div> : <div className="product-action-item"><span><Archive size={18} /></span><div><strong>Archive product</strong><p>Hide it from active product choices.</p></div><OperationForm operationId="product.archive" entityId={id} defaults={product} /></div>}<div className="product-action-item danger"><span><Trash2 size={18} /></span><div><strong>Delete product</strong><p>Delete only when it is no longer needed.</p></div><OperationForm operationId="product.delete" entityId={id} defaults={product} /></div></section><div className="product-detail-tip"><strong>Stock changes</strong><p>Adjust quantities and record stocktakes from the Inventory page.</p><Link href="/inventory#stock-actions">Go to stock actions →</Link></div></aside></div>
    </>}
  </div>;
}
