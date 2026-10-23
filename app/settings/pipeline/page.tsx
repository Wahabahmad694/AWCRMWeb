import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { StageOrder } from "@/components/modules/stage-order";
import { OperationForm } from "@/components/shared/operation-form";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { formatPkr } from "@/lib/crm-format";

export default async function Page() {
  const [stages, summary] = await Promise.all([moduleList("/pipeline/stages"), moduleDetail("/pipeline/summary")]);
  const rows = stages.rows.map(row => ({ id: String(row.id), name: value(row, "name"), color: String(row.color ?? ""), kind: String(row.kind ?? "open"), count: Number(row.count ?? row.lead_count ?? 0) }));
  const rate = summary.data.win_rate;
  const metrics = [
    ["Open pipeline value", formatPkr(Number(summary.data.open_pipeline_value_paisa ?? summary.data.open_value_paisa ?? 0))],
    ["Win rate · 90 days", typeof rate === "number" ? `${Math.round(rate * 100)}%` : "—"],
    ["Average days to close", summary.data.avg_days_to_close == null ? "—" : String(summary.data.avg_days_to_close)],
    ["Overdue follow-ups", String(summary.data.overdue_follow_ups ?? summary.data.overdue_count ?? "—")],
  ];
  return <div className="module-page"><ModuleHeader eyebrow="SETTINGS / LEADS" title="Pipeline stages" description="Organize lead stages and keep their order in sync with the board." />
    {!summary.error && <div className="statement-summary">{metrics.map(([label, number]) => <ModuleCard key={label}><span>{label}</span><strong>{number}</strong></ModuleCard>)}</div>}
    {stages.error ? <ModuleCard><p role="alert">{stages.error}</p></ModuleCard> : <ModuleCard><h2>Stage order</h2><p className="module-muted">Move stages up or down. Delete a stage after moving its leads elsewhere.</p><StageOrder key={JSON.stringify(rows)} stages={rows} /></ModuleCard>}
    <div className="operation-grid"><OperationForm operationId="pipelineStage.create" />{stages.rows.map(row => <OperationForm key={String(row.id)} operationId="pipelineStage.update" entityId={String(row.id)} defaults={row} />)}</div>
  </div>;
}
