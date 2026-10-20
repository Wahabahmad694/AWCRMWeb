import Link from "next/link";

export default function Loading() {
  return <div className="page-wrap" aria-busy="true"><div className="page-heading"><div><div className="eyebrow"><Link href="/customers">← Back to customers</Link></div><h1>Customer details</h1><p>Loading customer information…</p></div></div><section className="panel detail-panel" role="status">Loading…</section></div>;
}
