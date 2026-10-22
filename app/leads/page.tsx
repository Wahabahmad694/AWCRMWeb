import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";

const stages = [{ name: "New", color: "#3b82f6" }, { name: "Contacted", color: "#06b6d4" }, { name: "Quoted", color: "#a855f7" }, { name: "Negotiation", color: "#f59e0b" }, { name: "Won", color: "#10b981" }, { name: "Lost", color: "#ef4444" }];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "board" } = await searchParams;
  return <div className="module-page"><ModuleHeader eyebrow="SALES / PIPELINE" title="Leads" description="Follow every opportunity from first contact through conversion." action={{ href: "/leads/new", label: "+ New lead" }} />
    <ModuleCard><div className="module-toolbar"><div className="module-filter"><input aria-label="Search leads" placeholder="Search name, company, phone" disabled title="Available when the lead API is connected" /><select aria-label="Owner" disabled><option>All owners</option></select><select aria-label="Source" disabled><option>All sources</option></select></div><div className="module-segment"><Link className={view !== "list" ? "active" : ""} href="/leads?view=board">Board</Link><Link className={view === "list" ? "active" : ""} href="/leads?view=list">List</Link></div></div></ModuleCard>
    {view === "list" ? <ModuleCard><div className="module-table-scroll"><table className="module-table"><thead><tr><th>Name</th><th>Company</th><th>Stage</th><th>Expected value</th><th>Follow-up</th><th>Owner</th></tr></thead></table></div><div className="module-empty"><h2>No leads yet</h2><p>Lead records will appear here when the pipeline API is available.</p></div></ModuleCard> : <div className="pipeline-board">{stages.map(stage => <section className="pipeline-column" key={stage.name}><header><span className="stage-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong><span className="stage-count">0</span></header><div className="stage-value">Rs 0 expected</div><div className="stage-placeholder">No leads in this stage</div><Link href={`/leads/new?stage=${stage.name}`} className="stage-add">+ Add lead</Link></section>)}</div>}
  </div>;
}
