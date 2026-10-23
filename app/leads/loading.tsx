import { Columns3, Plus, Search } from "lucide-react";

export default function LeadsLoading() {
  return <div className="module-page leads-page leads-loading" aria-busy="true">
    <header className="leads-hero"><div><span className="leads-eyebrow">SALES WORKSPACE / PIPELINE</span><h1>Leads</h1><p>Follow every opportunity from first contact through conversion.</p></div><span className="leads-create"><Plus size={17} /> New lead</span></header>
    <section className="module-card leads-toolbar-card"><div className="leads-toolbar-heading"><span className="leads-toolbar-icon"><Columns3 size={19} /></span><div><h2>Lead pipeline</h2><p>Loading your pipeline…</p></div></div><div className="leads-loading-search"><Search size={16} /><span>Search leads</span></div></section>
    <div className="leads-loading-board" role="status" aria-label="Loading lead pipeline">{Array.from({ length: 4 }, (_, index) => <section className="pipeline-column" key={index}><div className="leads-loading-line wide" /><div className="leads-loading-line short" />{Array.from({ length: 2 }, (_, card) => <div className="leads-loading-card" key={card}><span /><span /><span /></div>)}</section>)}</div>
  </div>;
}
