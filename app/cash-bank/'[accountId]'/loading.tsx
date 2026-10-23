import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";

export default function Loading() {
  return <div className="module-page" aria-busy="true"><ModuleHeader eyebrow="MONEY / ACCOUNT BOOK" title="Account activity" description="Loading transactions…" /><ModuleCard><div className="module-list-skeleton" role="status" aria-label="Loading account activity"><div /><div /><div /><div /></div></ModuleCard></div>;
}
