import { ModuleHeader } from "@/components/modules/module-ui";
import { QuotationDraftForm } from "@/components/modules/quotation-draft-form";

export default function NewQuotationPage() {
  return <div className="module-page"><ModuleHeader eyebrow="SALES / QUOTATIONS / NEW" title="New quotation" description="Prepare an offer with a party, validity dates, items, and terms." /><QuotationDraftForm /></div>;
}
