import { Suspense } from "react";
import Link from "next/link";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { LeadDraftForm } from "@/components/modules/lead-draft-form";
import { moduleDetail, value } from "@/lib/module-data";

export default function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / LEADS / EDIT" title="Edit lead" description="Loading lead…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading edit lead"><div /><div /><div /><div /></div></ModuleCard></div>}><EditLeadContent params={params} /></Suspense>;
}

async function EditLeadContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: lead, error } = await moduleDetail(`/leads/${encodeURIComponent(id)}`);
  return <div className="module-page"><ModuleHeader eyebrow="SALES / LEADS / EDIT" title={error ? "Edit lead" : value(lead, "name")} description="Update contact and opportunity details." />{error ? <ModuleCard><p role="alert">{error}</p><Link href={`/leads/${encodeURIComponent(id)}`}>Back to lead</Link></ModuleCard> : <LeadDraftForm initial={lead} />}</div>;
}
