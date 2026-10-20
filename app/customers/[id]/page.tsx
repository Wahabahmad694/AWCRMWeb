import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Customers" apiPath="/customers" back="/customers" actions={['customer.update', 'customer.archive', 'customer.restore', 'customer.delete', 'customer.note', 'customer.activity']} related={(id) => [{ title: 'Orders', path: `/customers/${id}/orders`, columns: ['order_number', 'status', 'total_paisa'] }, { title: 'Payments', path: `/customers/${id}/payments`, columns: ['amount_paisa', 'method', 'status'] }, { title: 'Ledger', path: `/customers/${id}/ledger`, columns: ['type', 'amount_paisa', 'created_at'] }, { title: 'Activities', path: `/customers/${id}/activities`, columns: ['type', 'subject', 'due_at'] }]} />;
}
