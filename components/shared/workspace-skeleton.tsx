export function WorkspaceSkeleton({ title = "Your workspace", dashboard = false }: { title?: string; dashboard?: boolean }) {
  return <div className="page-wrap loading-workspace" role="status" aria-label={`Loading ${title.toLowerCase()}`} aria-busy="true">
    <span className="sr-only">Loading {title.toLowerCase()}…</span>
    <div className="page-heading"><div><div className="eyebrow">AW CRM WORKSPACE</div><h1>{title}</h1><div className="skeleton skeleton-subtitle" aria-hidden="true" /></div></div>
    {dashboard && <div className="metric-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div className="metric-card" key={i}><div className="skeleton skeleton-label" /><div className="skeleton skeleton-value" /><div className="skeleton skeleton-label" /></div>)}</div>}
    <div className={dashboard ? "lower-grid" : "skeleton-table"} aria-hidden="true">
      {Array.from({ length: dashboard ? 2 : 1 }, (_, i) => <div className="panel" key={i}><div className="skeleton skeleton-label" />{Array.from({ length: 5 }, (_, j) => <div className="skeleton skeleton-row" key={j} />)}</div>)}
    </div>
  </div>;
}
