import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowLeft, ArrowUpRight, Building2, CalendarDays, CreditCard, FileText, Mail, MapPin, Phone, ShoppingBag, UserRound, Wallet } from "lucide-react";
import { ApiError, apiRequest, getWorkspace, items, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";
import { OperationForm } from "@/components/shared/operation-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

type Related = { title: string; path: string; columns: { key: string; label: string }[]; icon: typeof ShoppingBag };
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
function money(value: unknown) { return typeof value === "number" ? formatPaisa(value) : "—"; }
function date(value: unknown) {
  if (typeof value !== "string") return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(); }
function rowValue(row: Record<string, unknown>, key: string) {
  if (key.endsWith("_paisa")) return money(row[key]);
  if (key.endsWith("_at")) return date(row[key]);
  return label(row[key] ?? (key === "subject" ? row.body ?? row.content ?? row.note : undefined));
}
export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<WorkspaceSkeleton title="Customer profile" />}><CustomerDetailContent params={params} /></Suspense>;
}
async function CustomerDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encodedId = encodeURIComponent(id);
  let customer: Record<string, unknown> = {};
  let error = "";
  let noOrganization = false;
  let organizationName = "WORKSPACE";
  const sections: Related[] = [
    { title: "Orders", path: `/customers/${encodedId}/orders`, icon: ShoppingBag, columns: [{ key: "order_number", label: "Order" }, { key: "status", label: "Status" }, { key: "total_paisa", label: "Total" }] },
    { title: "Payments", path: `/customers/${encodedId}/payments`, icon: CreditCard, columns: [{ key: "amount_paisa", label: "Amount" }, { key: "method", label: "Method" }, { key: "status", label: "Status" }] },
    { title: "Ledger", path: `/customers/${encodedId}/ledger`, icon: Wallet, columns: [{ key: "type", label: "Type" }, { key: "amount_paisa", label: "Amount" }, { key: "created_at", label: "Date" }] },
    { title: "Activities", path: `/customers/${encodedId}/activities`, icon: Activity, columns: [{ key: "type", label: "Type" }, { key: "subject", label: "Subject" }, { key: "due_at", label: "Due" }] },
  ];
  let related: { section: Related; rows: Record<string, unknown>[]; error: string }[] = [];
  try {
    const workspace = await getWorkspace(`/customers/${encodedId}`);
    organizationName = label(workspace.organization?.name) === "—" ? "WORKSPACE" : String(workspace.organization?.name);
    noOrganization = !workspace.organizationId;
    if (workspace.organizationId) {
      const raw = await apiRequest(`/customers/${encodedId}`, { token: workspace.token, organizationId: workspace.organizationId });
      customer = unwrap(raw);
      related = await Promise.all(sections.map(async section => {
        try { return { section, rows: items(await apiRequest(section.path, { token: workspace.token, organizationId: workspace.organizationId, query: section.title === "Ledger" ? undefined : { page: 1, limit: 5 } })), error: "" }; }
        catch (cause) { return { section, rows: [], error: cause instanceof ApiError ? cause.message : "Unavailable" }; }
      }));
    }
  } catch (cause) { error = cause instanceof ApiError && cause.status === 403 ? "Your role does not have access to this customer." : cause instanceof Error ? cause.message : "Unable to load this customer."; }
  const name = label(customer.name) === "—" ? "Customer profile" : String(customer.name);
  const phone = label(customer.phone);
  const email = label(customer.email);
  const city = label(customer.city);
  const area = label(customer.area);
  const address = label(customer.address);
  const tags = Array.isArray(customer.tags) ? customer.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const balance = customer.balance_paisa ?? customer.outstanding_balance_paisa ?? customer.current_balance_paisa;
  return <div className="customer-detail-page"><div className="customer-detail-back"><Link href="/customers"><ArrowLeft size={15} /> Back to customers</Link></div>
    {error || noOrganization || Object.keys(customer).length === 0 ? <section className="customer-detail-panel customer-detail-message" role={error ? "alert" : undefined}>{error || (noOrganization ? "Select or create an organization to view this customer." : "Customer details are unavailable.")}</section> : <>
      <header className="customer-profile-hero"><div className="customer-profile-main"><span className="customer-profile-avatar" aria-hidden="true">{initials(name)}</span><div><span className="customer-profile-kicker">{organizationName} / CUSTOMER PROFILE</span><h1>{name}</h1><p>{label(customer.business_name) !== "—" ? <><Building2 size={15} /> {label(customer.business_name)}</> : <><UserRound size={15} /> Customer relationship</>}</p><div className="customer-profile-badges"><StatusBadge value={String(customer.status ?? "active")} /><span>{label(customer.type)}</span>{label(customer.code) !== "—" && <span>{label(customer.code)}</span>}</div></div></div><a href="#customer-actions" className="customer-profile-action">Manage customer <ArrowUpRight size={16} /></a></header>
      <section className="customer-detail-stats" aria-label="Customer overview"><article><span>Current balance</span><strong>{money(balance)}</strong><small>{balance === undefined ? "No balance data" : "Customer account"}</small></article><article><span>Credit limit</span><strong>{money(customer.credit_limit_paisa)}</strong><small>Approved limit</small></article><article><span>Orders shown</span><strong>{related.find(item => item.section.title === "Orders")?.rows.length ?? 0}</strong><small>Recent orders</small></article><article><span>Activities shown</span><strong>{related.find(item => item.section.title === "Activities")?.rows.length ?? 0}</strong><small>Recent interactions</small></article></section>
      <div className="customer-detail-main"><div className="customer-detail-primary"><section className="customer-detail-panel"><div className="customer-detail-panel-heading"><span className="customer-detail-icon"><UserRound size={19} /></span><div><h2>Contact information</h2><p>Everything you need to reach this customer.</p></div></div><div className="customer-detail-fields"><div><span><Phone size={15} /> Phone</span>{phone === "—" ? <strong>—</strong> : <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}>{phone}</a>}</div><div><span><Mail size={15} /> Email</span>{email === "—" ? <strong>—</strong> : <a href={`mailto:${email}`}>{email}</a>}</div><div><span><MapPin size={15} /> Location</span><strong>{[area, city].filter(value => value !== "—").join(", ") || "—"}</strong></div><div><span><MapPin size={15} /> Address</span><strong>{address}</strong></div></div></section>
      <section className="customer-detail-panel"><div className="customer-detail-panel-heading"><span className="customer-detail-icon"><FileText size={19} /></span><div><h2>Relationship details</h2><p>Context that helps your team stay informed.</p></div></div><div className="customer-detail-fields"><div><span>Business name</span><strong>{label(customer.business_name)}</strong></div><div><span>Customer code</span><strong>{label(customer.code)}</strong></div><div><span>Assigned to</span><strong>{label(customer.assigned_to_name ?? customer.assigned_to_id)}</strong></div><div><span><CalendarDays size={15} /> Added</span><strong>{date(customer.created_at)}</strong></div></div>{tags.length > 0 && <div className="customer-detail-tags"><span>Tags</span><div>{tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>}{label(customer.notes) !== "—" && <div className="customer-detail-notes"><span>Notes</span><p>{label(customer.notes)}</p></div>}</section></div>
      <aside className="customer-detail-aside"><section className="customer-detail-panel customer-detail-quick"><h2>Quick contact</h2><p>Start a conversation from this profile.</p><div>{phone !== "—" && <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}><Phone size={16} /> Call customer <ArrowUpRight size={15} /></a>}{email !== "—" && <a href={`mailto:${email}`}><Mail size={16} /> Send email <ArrowUpRight size={15} /></a>}{phone === "—" && email === "—" && <span>No contact details yet. Add a phone number or email with Edit customer.</span>}</div></section><section className="customer-detail-panel customer-detail-quick"><h2>Account snapshot</h2><div className="customer-detail-side-values"><div><span>Status</span><StatusBadge value={String(customer.status ?? "active")} /></div><div><span>Type</span><strong>{label(customer.type)}</strong></div><div><span>Last updated</span><strong>{date(customer.updated_at)}</strong></div></div></section></aside></div>
      <section className="customer-detail-related"><div className="customer-detail-section-heading"><span>ACTIVITY & FINANCE</span><h2>Connected records</h2><p>Orders, payments, ledger entries, and interactions for this customer.</p></div><div className="customer-detail-related-grid">{related.map(({ section, rows, error: sectionError }) => { const Icon = section.icon; return <section className="customer-detail-panel customer-detail-related-card" key={section.path}><div className="customer-detail-related-head"><span><Icon size={18} /></span><div><h3>{section.title}</h3><p>{rows.length} recent {section.title.toLowerCase()}</p></div></div>{sectionError ? <p className="customer-detail-empty" role="alert">{sectionError}</p> : rows.length === 0 ? <p className="customer-detail-empty">No {section.title.toLowerCase()} recorded yet.</p> : <div className="customer-detail-table-wrap"><table><thead><tr>{section.columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{section.columns.map(column => <td key={column.key}>{rowValue(row, column.key)}</td>)}</tr>)}</tbody></table></div>}</section>; })}</div></section>
      <section id="customer-actions" className="customer-detail-actions"><div className="customer-detail-section-heading"><span>MANAGE RELATIONSHIP</span><h2>Customer actions</h2><p>Keep details current and record the next touchpoint.</p></div><div className="customer-detail-action-grid"><OperationForm operationId="customer.update" entityId={id} defaults={customer} /><OperationForm operationId="customer.note" entityId={id} defaults={customer} /><OperationForm operationId="customer.activity" entityId={id} defaults={customer} />{String(customer.status ?? "").toLowerCase() === "archived" ? <OperationForm operationId="customer.restore" entityId={id} defaults={customer} /> : <OperationForm operationId="customer.archive" entityId={id} defaults={customer} />}<OperationForm operationId="customer.delete" entityId={id} defaults={customer} /></div></section>
    </>}
  </div>;
}
