import { ModuleCard } from "@/components/modules/module-ui";
import { PrintTrigger } from "@/components/modules/print-trigger";
import { moduleDetail, value } from "@/lib/module-data";
import { formatDate, formatPkr } from "@/lib/crm-format";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await moduleDetail(`/credit-notes/${encodeURIComponent(id)}`);
  return <div className="print-document"><PrintTrigger />{error ? <ModuleCard><p role="alert">{error}</p></ModuleCard> : <><header><strong>{value(data, "business.name", "organization.name")}</strong><span>CREDIT NOTE</span></header><div className="print-document-head"><div><h1>{value(data, "number", "credit_note_number")}</h1><p>Issued {formatDate(data.issued_at ?? data.created_at)}</p></div><div><span>Customer</span><strong>{value(data, "customer.name", "customer_name")}</strong></div></div><div className="print-credit-total"><span>Credit amount</span><strong>{formatPkr(Number(data.amount_paisa ?? 0))}</strong></div><div className="print-credit-total"><span>Remaining balance</span><strong>{formatPkr(Number(data.remaining_paisa ?? 0))}</strong></div>{data.status === "void" && <div className="print-watermark">VOID</div>}</>}</div>;
}
