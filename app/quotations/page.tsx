import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, FileText, Plus, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { ModuleEmpty } from "@/components/modules/module-ui";
import { moduleList, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";

const statuses = ["all", "draft", "sent", "accepted", "rejected", "expired", "converted"];
type QuotationSearchParams = Promise<{ status?: string; search?: string; page?: string; from?: string; to?: string }>;

function QuotationHeading() {
  return <header className="quotation-hero">
    <div className="quotation-hero-copy"><span className="quotation-eyebrow"><Sparkles size={14} /> SALES WORKSPACE <span>/</span> QUOTATIONS</span><h1>Quotations</h1><p>Create compelling offers, follow every decision, and turn accepted quotes into orders.</p></div>
    <Link className="quotation-create" href="/quotations/new"><Plus size={17} strokeWidth={2.5} /> New quotation</Link>
  </header>;
}

export default function QuotationsPage({ searchParams }: { searchParams: QuotationSearchParams }) {
  return <main className="module-page quotation-page"><QuotationHeading /><Suspense fallback={<section className="quotation-surface" aria-label="Loading quotations"><div className="quotation-loading-head"><span>Loading quotations</span><span>Please wait…</span></div><div className="module-list-skeleton" role="status" aria-label="Loading quotations"><div /><div /><div /><div /></div></section>}><QuotationsContent searchParams={searchParams} /></Suspense></main>;
}

async function QuotationsContent({ searchParams }: { searchParams: QuotationSearchParams }) {
  const params = await searchParams;
  const status = statuses.includes(params.status ?? "") ? params.status! : "all";
  const search = (params.search ?? "").slice(0, 100);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const result = await moduleList("/quotations", { status: status === "all" ? undefined : status, search: search || undefined, from: params.from || undefined, to: params.to || undefined, page, limit: 20 });
  const href = (nextStatus: string, nextPage = 1) => `/quotations?status=${nextStatus}&search=${encodeURIComponent(search)}&page=${nextPage}${params.from ? `&from=${encodeURIComponent(params.from)}` : ""}${params.to ? `&to=${encodeURIComponent(params.to)}` : ""}`;
  const hasFilters = Boolean(search || params.from || params.to || status !== "all");

  return <section className="quotation-surface" aria-label="Quotations workspace">
    <div className="quotation-surface-head"><div className="quotation-surface-icon"><FileText size={19} /></div><div><h2>All quotations</h2><p>{result.error ? "Unable to load your quotations" : `${result.rows.length} ${result.rows.length === 1 ? "quotation" : "quotations"} shown${page > 1 ? ` · Page ${page}` : ""}`}</p></div><span className="quotation-head-badge">Sales pipeline</span></div>
    <form className="quotation-filters" action="/quotations"><input type="hidden" name="status" value={status} /><div className="quotation-search"><label htmlFor="quotation-search">Search quotations</label><div className="quotation-search-input"><Search size={17} aria-hidden="true" /><input id="quotation-search" name="search" placeholder="Search number or party…" defaultValue={search} /></div></div><div className="quotation-date"><label htmlFor="quotation-from">Issue date from</label><div className="quotation-date-input"><CalendarDays size={16} aria-hidden="true" /><input id="quotation-from" name="from" type="date" defaultValue={params.from} /></div></div><div className="quotation-date"><label htmlFor="quotation-to">Before date</label><div className="quotation-date-input"><CalendarDays size={16} aria-hidden="true" /><input id="quotation-to" name="to" type="date" defaultValue={params.to} /></div></div><button className="quotation-apply" type="submit"><SlidersHorizontal size={16} /> Apply filters</button>{hasFilters && <Link className="quotation-clear" href="/quotations">Clear</Link>}</form>
    <nav className="quotation-tabs" aria-label="Quotation status">{statuses.map(item => <Link key={item} aria-current={status === item ? "page" : undefined} className={status === item ? "active" : ""} href={href(item)}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>
    {result.error ? <div role="alert" className="quotation-feedback"><FileText size={24} /><h3>Couldn’t load quotations</h3><p>{result.error}</p><Link href={href(status)}>Try again <ArrowRight size={15} /></Link></div> : result.rows.length === 0 ? <ModuleEmpty title="No quotations found" description={hasFilters ? "Try another search, date range, or status to see more results." : "Create your first offer to start tracking it here."} action={{ href: "/quotations/new", label: "Create quotation" }} /> : <><div className="quotation-table-scroll"><table className="quotation-table"><thead><tr><th>Quotation</th><th>Party</th><th>Issued</th><th>Valid until</th><th className="quotation-money">Total</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{result.rows.map((row, index) => <tr key={String(row.id ?? index)}><td><Link className="quotation-number" href={`/quotations/${encodeURIComponent(String(row.id))}`}><span className="quotation-row-icon"><FileText size={16} /></span><span>{value(row, "number", "quotation_number")}</span></Link></td><td><span className="quotation-party">{value(row, "party.name", "customer.name", "lead.name", "party_name")}</span>{Boolean(row.lead_id) && <small className="quotation-lead-tag">Lead</small>}</td><td>{formatDate(row.issue_date)}</td><td>{formatDate(row.valid_until)}</td><td className="quotation-money quotation-total">{formatPkr(Number(row.total_paisa ?? 0))}</td><td><span className={`module-status status-${String(row.status ?? "draft")}`}>{value(row, "status")}</span></td><td><Link className="quotation-row-open" aria-label={`Open ${value(row, "number", "quotation_number")}`} href={`/quotations/${encodeURIComponent(String(row.id))}`}><ArrowRight size={17} /></Link></td></tr>)}</tbody></table></div><nav className="quotation-pagination" aria-label="Quotation pages"><span>Showing {result.rows.length} on page {page}</span><div>{page > 1 && <Link href={href(status, page - 1)}>Previous</Link>}{result.rows.length === 20 && <Link href={href(status, page + 1)}>Next <ArrowRight size={14} /></Link>}</div></nav></>}
  </section>;
}
