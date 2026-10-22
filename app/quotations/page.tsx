import Link from "next/link";
import { ModuleCard, ModuleEmpty, ModuleHeader } from "@/components/modules/module-ui";

const statuses = ["All", "Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"];

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const { status = "All", search = "" } = await searchParams;
  return <div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS" title="Quotations" description="Create priced offers, track their outcome, and turn accepted quotes into orders." action={{ href: "/quotations/new", label: "+ New quotation" }} />
    <ModuleCard><form className="module-filter" action="/quotations"><label className="sr-only" htmlFor="quotation-search">Search quotations</label><input id="quotation-search" name="search" placeholder="Search number or party" defaultValue={search} /><label className="sr-only" htmlFor="quotation-status">Status</label><select id="quotation-status" name="status" defaultValue={statuses.includes(status) ? status : "All"}>{statuses.map(item => <option key={item}>{item}</option>)}</select><button type="submit">Apply filters</button></form>
      <div className="module-chips">{statuses.map(item => <Link key={item} className={status === item ? "active" : ""} href={`/quotations?status=${item}`}>{item}</Link>)}</div>
      <div className="module-table-scroll"><table className="module-table"><thead><tr><th>Number</th><th>Party</th><th>Issue date</th><th>Valid until</th><th>Total</th><th>Status</th></tr></thead></table></div>
      <ModuleEmpty title="No quotations yet" description="Your quotations will appear here once the quotation API is available." action={{ href: "/quotations/new", label: "Create a quotation" }} /></ModuleCard>
  </div>;
}
