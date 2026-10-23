import { Suspense } from "react";
import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { record } from "@/lib/api";
import { LeadMoveControl } from "@/components/modules/lead-move-control";
import { LeadActions } from "@/components/modules/lead-actions";
import { WhatsAppFollowup } from "@/components/modules/whatsapp-followup";
import { formatDate, formatPkr } from "@/lib/crm-format";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / LEADS / DETAIL" title="Lead" description="Loading lead…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading lead"><div /><div /><div /><div /></div></ModuleCard></div>}><LeadDetailContent params={params} /></Suspense>;
}

async function LeadDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: lead, error }, templates, stages, customers] = await Promise.all([
    moduleDetail(`/leads/${encodeURIComponent(id)}`),
    moduleList("/message-templates", { context: "lead" }),
    moduleList("/pipeline/stages"),
    moduleList("/customers", { limit: 100 }),
  ]);
  const archived = Boolean(lead.archived_at ?? lead.is_archived) || lead.status === "archived";
  const converted = Boolean(lead.converted_customer_id ?? lead.customer_id ?? lead.converted_at);
  const history = Array.isArray(lead.history) ? lead.history.map(record) : [];
  const stageOptions = stages.rows.map(row => ({ id: String(row.id), name: value(row, "name"), kind: String(row.kind ?? "open") }));

  return <div className="module-page">
    <ModuleHeader eyebrow="SALES / LEADS / DETAIL" title={error ? "Lead" : value(lead, "name")} description={error ?? value(lead, "stage.name", "company", "company_name")} />
    {error ? <ModuleCard><p role="alert">{error}</p><Link href={`/leads/${encodeURIComponent(id)}`}>Retry</Link></ModuleCard> : <>
      <div className="module-actions"><Link className="module-secondary" href={`/leads/${encodeURIComponent(id)}/edit`}>Edit details</Link><Link className="module-secondary" href="/leads">Back to pipeline</Link></div>
      <ModuleCard><h2>Stage</h2>{archived ? <p className="module-muted">This lead is archived. Restore it to move it through the pipeline.</p> : converted ? <p className="module-muted">Converted to customer.</p> : <LeadMoveControl leadId={id} version={Number(lead.version ?? 0)} currentStageId={String(lead.stage_id ?? record(lead.stage).id ?? "")} stages={stageOptions} />}</ModuleCard>
      <ModuleCard><div className="detail-summary"><div><span>Company</span><strong>{value(lead, "company", "company_name")}</strong></div><div><span>Phone</span><strong>{value(lead, "phone")}</strong></div><div><span>Email</span><strong>{value(lead, "email")}</strong></div><div><span>Source</span><strong>{value(lead, "source")}</strong></div><div><span>Expected value</span><strong>{formatPkr(Number(lead.expected_value_paisa ?? 0))}</strong></div><div><span>Next follow-up</span><strong>{formatDate(lead.next_follow_up_date)}</strong></div></div></ModuleCard>
      {lead.notes && <ModuleCard><h2>Notes</h2><p dir="auto">{String(lead.notes)}</p></ModuleCard>}
      {history.length > 0 && <ModuleCard><h2>Stage history</h2><div className="lead-history">{history.map((entry, index) => <div key={String(entry.id ?? index)}><strong>{value(entry, "to_stage.name", "stage.name", "to_stage_name")}</strong><span>{formatDate(entry.created_at ?? entry.moved_at)}</span>{Boolean(entry.lost_reason) && <small>{String(entry.lost_reason)}</small>}</div>)}</div></ModuleCard>}
      {!archived && !converted && <WhatsAppFollowup targetType="lead" targetId={id} phone={String(lead.phone ?? "")} optedOut={lead.whatsapp_opt_out === true} context="lead" templates={templates.rows.map(row => ({ id: String(row.id), name: value(row, "name"), language: value(row, "locale") }))} />}
      {!archived && !converted && <div className="module-actions"><Link className="module-secondary" href={`/quotations/new?lead=${encodeURIComponent(id)}`}>New quotation</Link></div>}
      <ModuleCard><h2>Lead actions</h2><LeadActions leadId={id} version={Number(lead.version ?? 0)} archived={archived} converted={converted} customers={customers.rows.map(row => ({ id: String(row.id), name: value(row, "name", "business_name") })).filter(row => row.id)} /></ModuleCard>
    </>}
  </div>;
}
