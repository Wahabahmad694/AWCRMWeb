import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, Boxes, CalendarDays, CheckCircle2, ClipboardList, Hash, Package, ShieldCheck, TriangleAlert } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, record, unwrap } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };
const text = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : fallback;
const numeric = (value: unknown) => { const parsed = typeof value === "number" ? value : Number(value); return Number.isFinite(parsed) ? parsed : 0; };
const quantity = (value: unknown, scale: number) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: Math.min(Math.max(scale, 0), 6) }).format(numeric(value));
function date(value: unknown) { if (typeof value !== "string") return "—"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed); }

export default function InventoryDetailPage({ params }: Props) {
  return <Suspense fallback={<div className="inventory-detail-page" role="status" aria-label="Loading inventory item"><div className="module-list-skeleton"><div /><div /><div /><div /></div></div>}><InventoryDetailContent params={params} /></Suspense>;
}

async function InventoryDetailContent({ params }: Props) {
  const { id } = await params;
  const encodedId = encodeURIComponent(id);
  let item: Record<string, unknown> = {};
  let error = "";
  try {
    const workspace = await getWorkspace(`/inventory/${encodedId}`);
    if (!workspace.organizationId) error = "Select an organization to view this inventory item.";
    else item = unwrap(await apiRequest(`/inventory/${encodedId}`, { token: workspace.token, organizationId: workspace.organizationId }));
  } catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load this inventory item."; }

  const product = record(item.product);
  const name = text(item.product_name ?? item.name ?? product.name, "Inventory item");
  const sku = text(item.sku ?? product.sku, "No SKU assigned");
  const unit = text(item.unit ?? product.unit, "units");
  const scale = numeric(item.quantity_scale ?? product.quantity_scale);
  const onHand = numeric(item.on_hand ?? item.quantity);
  const reserved = numeric(item.reserved);
  const available = item.available === undefined ? onHand - reserved : numeric(item.available);
  const lowLevel = numeric(item.low_stock_level ?? product.low_stock_level);
  const isLow = item.is_low === true || available <= lowLevel;
  const updatedAt = item.updated_at ?? item.created_at;
  const productId = text(item.product_id ?? item.id ?? product.id, id);

  return <main className="inventory-detail-page">
    <Link href="/inventory" className="inventory-detail-back"><ArrowLeft size={16} /> Back to inventory</Link>
    {error || Object.keys(item).length === 0 ? <section className="inventory-detail-message" role={error ? "alert" : undefined}>{error || "Inventory details are unavailable."}</section> : <>
      <header className="inventory-detail-hero"><div className="inventory-detail-product-icon"><Package size={30} /></div><div className="inventory-detail-title"><span>INVENTORY / STOCK PROFILE</span><h1>{name}</h1><p><Hash size={14} /> {sku}<span>•</span>{unit}</p></div><span className={`inventory-detail-status ${isLow ? "attention" : "healthy"}`}>{isLow ? <TriangleAlert size={15} /> : <CheckCircle2 size={15} />}{isLow ? "Low stock" : "Stock healthy"}</span></header>
      <section className="inventory-detail-metrics" aria-label="Stock summary"><article><span className="blue"><Boxes size={20} /></span><div><small>On hand</small><strong>{quantity(onHand, scale)}</strong><p>{unit} physically in stock</p></div></article><article><span className="violet"><ShieldCheck size={20} /></span><div><small>Reserved</small><strong>{quantity(reserved, scale)}</strong><p>{unit} committed to orders</p></div></article><article><span className={isLow ? "amber" : "teal"}>{isLow ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}</span><div><small>Available</small><strong>{quantity(available, scale)}</strong><p>{isLow ? `Alert at ${quantity(lowLevel, scale)} ${unit}` : `${quantity(available - lowLevel, scale)} ${unit} above threshold`}</p></div></article></section>
      <div className="inventory-detail-layout"><section className="inventory-detail-card"><div className="inventory-detail-card-head"><span><ClipboardList size={19} /></span><div><h2>Stock details</h2><p>Current quantities and replenishment settings.</p></div></div><div className="inventory-detail-fields"><div><span>Product</span><strong>{name}</strong></div><div><span>SKU</span><strong className="mono">{sku}</strong></div><div><span>Unit of measure</span><strong>{unit}</strong></div><div><span>Quantity precision</span><strong>{scale} decimal {scale === 1 ? "place" : "places"}</strong></div><div><span>Low stock threshold</span><strong>{quantity(lowLevel, scale)} {unit}</strong></div><div><span>Last updated</span><strong>{date(updatedAt)}</strong></div></div></section>
        <aside className="inventory-detail-side"><section className={`inventory-detail-health ${isLow ? "attention" : "healthy"}`}><span>{isLow ? <TriangleAlert size={22} /> : <CheckCircle2 size={22} />}</span><h2>{isLow ? "Stock needs attention" : "Inventory is healthy"}</h2><p>{isLow ? `Available stock has reached the alert level of ${quantity(lowLevel, scale)} ${unit}. Consider replenishing this item.` : `You have ${quantity(available, scale)} ${unit} available for new orders.`}</p></section><section className="inventory-detail-card inventory-detail-quick"><h2>Quick actions</h2><p>Keep this item accurate and ready for sale.</p><div><Link href="/inventory#stock-actions"><Boxes size={16} /> Adjust stock <ArrowUpRight size={15} /></Link><Link href="/inventory/movements"><ClipboardList size={16} /> View movements <ArrowUpRight size={15} /></Link><Link href={`/products/${encodeURIComponent(productId)}`}><Package size={16} /> Open product <ArrowUpRight size={15} /></Link></div></section></aside></div>
      <footer className="inventory-detail-audit"><CalendarDays size={15} /><span>Inventory ID</span><code>{productId}</code><span>•</span><span>Updated {date(updatedAt)}</span></footer>
    </>}
  </main>;
}
