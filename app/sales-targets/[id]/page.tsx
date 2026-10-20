import { formatPaisa } from "@/lib/display";
import { Suspense } from "react";
import { DetailPage } from "@/components/shared/detail-page";
import { ApiError, apiRequest, getWorkspace, record, unwrap } from "@/lib/api";
export default function Page({ params }: { params: Promise<{id: string}> }) {
  return <Suspense fallback={<div className="page-wrap" aria-busy="true"><div className="page-heading"><div><h1>Sales targets</h1><p>Loading target…</p></div></div></div>}><TargetContent params={params} /></Suspense>;
}

async function TargetContent({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  const workspace = await getWorkspace(`/sales-targets/${encodeURIComponent(id)}`);
  let progress: Record<string,unknown> = {};
  let error = "";
  try { if (workspace.organizationId) progress = unwrap(await apiRequest(`/targets/${encodeURIComponent(id)}/progress`, { token:workspace.token, organizationId:workspace.organizationId })); }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load progress."; }
  return <><DetailPage title="Sales targets" path={`/targets/${encodeURIComponent(id)}`} back="/sales-targets" actions={["target.update","target.archive"]} /><section className="panel progress-panel"><h2>Progress</h2>{error ? <p role="alert">{error}</p> : Object.keys(progress).length ? <dl>{Object.entries(record(progress)).filter(([,value]) => typeof value === "number" || typeof value === "string").map(([key,value]) => <div key={key}><dt>{key.replaceAll("_"," ")}</dt><dd>{key.endsWith("_paisa") && typeof value === "number" ? formatPaisa(value) : String(value)}</dd></div>)}</dl> : <p>No progress available.</p>}</section></>;
}
