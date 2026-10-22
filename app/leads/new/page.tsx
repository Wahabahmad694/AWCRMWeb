import { ModuleHeader } from "@/components/modules/module-ui";
import { LeadDraftForm } from "@/components/modules/lead-draft-form";

export default function NewLeadPage() {
  return <div className="module-page"><ModuleHeader eyebrow="SALES / LEADS / NEW" title="New lead" description="Capture a contact and plan the next follow-up." /><LeadDraftForm /></div>;
}
