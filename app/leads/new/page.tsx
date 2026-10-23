import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { LeadDraftForm } from "@/components/modules/lead-draft-form";
import { moduleList, value } from "@/lib/module-data";

export default function NewLeadPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  return <Suspense fallback={<div className="module-page"><ModuleHeader eyebrow="SALES / LEADS / NEW" title="New lead" description="Loading form options…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading new lead"><div /><div /><div /><div /></div></ModuleCard></div>}><NewLeadContent searchParams={searchParams} /></Suspense>;
}

async function NewLeadContent({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage = "" } = await searchParams;
  const result = await moduleList("/pipeline/stages");
  const stages = result.rows.map(row => ({ id: String(row.id), name: value(row, "name") }));
  return <div className="module-page lead-form-page"><header className="lead-form-hero"><div><Link href="/leads" className="lead-form-back"><ArrowLeft size={15} /> Back to leads</Link><span className="leads-eyebrow"><Sparkles size={14} /> SALES WORKSPACE <span>/</span> NEW LEAD</span><h1>New lead</h1><p>Capture a new opportunity and plan the next step.</p></div><div className="lead-form-hero-hint"><span>01</span><strong>Lead details</strong><small>Contact and opportunity</small></div></header><LeadDraftForm stages={stages} defaultStageId={stages.some(item => item.id === stage) ? stage : ""} /></div>;
}
