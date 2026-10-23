import { ModuleHeader } from "@/components/modules/module-ui";

export default function Loading() {
  return <div className="module-page" aria-busy="true"><ModuleHeader eyebrow="MONEY / ACCOUNTS" title="Cash and bank" description="Loading account balances…" /><div className="module-list-skeleton" role="status" aria-label="Loading cash and bank"><div /><div /><div /><div /></div></div>;
}
