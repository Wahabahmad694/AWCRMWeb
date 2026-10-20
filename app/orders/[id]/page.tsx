import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Orders" apiPath="/orders" back="/orders" actions={['order.update', 'order.confirm', 'order.process', 'order.fulfill', 'order.cancel', 'order.return']} related={(id) => [{ title: 'Payments', path: `/orders/${id}/payments`, columns: ['amount_paisa', 'method', 'status'] }, { title: 'Timeline', path: `/orders/${id}/activities`, columns: ['type', 'subject', 'created_at'] }]} />;
}
