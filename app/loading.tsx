export default function Loading() {
  return <div className="page-wrap" aria-busy="true" role="status">
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>Loading workspace…</h1><p>Getting your latest business information.</p></div></div>
    <section className="panel resource-panel"><div className="resource-state">Loading…</div></section>
  </div>;
}
