import { ModuleHeader } from "@/components/modules/module-ui";
import { moduleDetail, moduleList, value } from "@/lib/module-data";
import { record } from "@/lib/api";
import { ReturnWizard } from "@/components/modules/return-wizard";

export default async function Page({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id = "" } = await searchParams;
  const [orders, accounts, returnable] = await Promise.all([moduleList("/orders", { status: "fulfilled", limit: 100 }), moduleList("/payment-accounts"), order_id ? moduleDetail(`/orders/${encodeURIComponent(order_id)}/returnable`) : Promise.resolve({ data: {} })]);
  const data = record(returnable.data);
  const lines = Array.isArray(data.lines) ? data.lines.map(record) : Array.isArray(data.items) ? data.items.map(record) : [];
  return <div className="module-page"><ModuleHeader eyebrow="SALES / RETURNS / NEW" title="Create return" description="Select items, choose how to settle the customer, then review the draft." /><ReturnWizard key={order_id || "choose"} orders={orders.rows.map(order => ({ id: String(order.id), name: value(order, "number", "order_number") }))} accounts={accounts.rows.filter(row => row.status !== "inactive" && row.active !== false).map(row => ({ id: String(row.id), name: value(row, "name") }))} initialOrderId={order_id} initialLines={lines.map(line => ({ id: String(line.order_item_id ?? line.id), description: value(line, "description", "product.name"), ordered: Number(line.ordered_quantity ?? line.quantity ?? 0), returned: Number(line.returned_quantity ?? 0), returnable: Number(line.returnable_quantity ?? 0), pricePaisa: Number(line.unit_price_paisa ?? 0) }))} /></div>;
}
