import Link from "next/link";
import { resourceReturnPath } from "@/lib/navigation";
import { Suspense } from "react";
import { OperationForm } from "@/components/shared/operation-form";
import { ApiError, apiRequest, getWorkspace, items, unwrap } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

type DetailProps = { title: string; path: string; back: string; actions?: string[]; actionGroupsByStatus?: Record<string, string[]>; related?: { title: string; path: string; columns: string[] }[] };

function relatedValue(row: Record<string, unknown>, key: string) {
  const value = row[key] ?? (key === "subject" ? row.body ?? row.content ?? row.note : undefined);
  if (key.endsWith("_paisa") && typeof value === "number") return formatPaisa(value);
  if ((key.endsWith("_at") || key.endsWith("_date")) && typeof value === "string") {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: key.endsWith("_at") ? "short" : undefined }).format(date);
  }
  if ((key === "status" || key === "type" || key.endsWith("_status")) && typeof value === "string") return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
  return String(value ?? "—");
}

export function DetailPage(props: DetailProps) {
  return <Suspense fallback={<div className="page-wrap" aria-busy="true"><div className="page-heading"><div><div className="eyebrow"><Link href={props.back}>← Back to {props.title.toLowerCase()}</Link></div><h1>{props.title}</h1><p>Loading record details…</p></div></div><section className="panel detail-panel" role="status">Loading…</section></div>}>
    <DetailContent {...props} />
  </Suspense>;
}

async function DetailContent({ title, path, back, actions = [], actionGroupsByStatus, related = [] }: DetailProps) {
  let workspace: Awaited<ReturnType<typeof getWorkspace>>;
  try { workspace = await getWorkspace(resourceReturnPath(path)); }
  catch (cause) {
    if (!(cause instanceof ApiError)) throw cause;
    return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow"><Link href={back}>← Back to {title.toLowerCase()}</Link></div><h1>{title}</h1></div></div><section className="panel detail-panel"><p role="alert">{cause.message}</p></section></div>;
  }
  let data: Record<string, unknown> = {};
  let error = "";
  try { if (workspace.organizationId) data = unwrap(await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId })); }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load this record."; }
  const relatedResults = await Promise.all(related.map(async section => {
    try { return { ...section, rows: workspace.organizationId ? items(await apiRequest(section.path, { token: workspace.token, organizationId: workspace.organizationId, query: section.path.endsWith("/ledger") ? undefined : { page: 1, limit: 10 } })) : [], error: "" }; }
    catch (cause) { return { ...section, rows: [], error: cause instanceof ApiError ? cause.message : "Unavailable" }; }
  }));
  const status = typeof data.status === "string" ? data.status.toLowerCase() : "";
  const visibleActions = actionGroupsByStatus ? actionGroupsByStatus[status] ?? [] : actions;
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow"><Link href={back}>← Back to {title.toLowerCase()}</Link></div><h1>{String(data.name ?? data.order_number ?? title)}</h1><p>Record details from your organization</p></div></div><section className="panel detail-panel">{error ? <p role="alert">{error}</p> : Object.keys(data).length === 0 ? <p>No details available.</p> : <dl>{Object.entries(data).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{key.endsWith("_paisa") && typeof value === "number" ? formatPaisa(value) : String(value ?? "—")}</dd></div>)}</dl>}</section>{!error && visibleActions.length > 0 && <div className="operation-grid">{visibleActions.map(id => <OperationForm key={id} operationId={id} entityId={path.split("/").at(-1)} defaults={data} />)}</div>}{relatedResults.map(section => <section className="panel related-panel" key={section.path}><h2>{section.title}</h2>{section.error ? <p role="alert">{section.error}</p> : section.rows.length === 0 ? <p>No records found.</p> : <div className="resource-table-wrap"><table className="resource-table"><thead><tr>{section.columns.map(column => <th key={column}>{column.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{section.rows.map((row,index) => <tr key={String(row.id ?? index)}>{section.columns.map(column => <td key={column}>{relatedValue(row,column)}</td>)}</tr>)}</tbody></table></div>}</section>)}</div>;
}
