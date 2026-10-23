import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Orders" apiPath="/orders" back="/orders" actionGroupsByStatus={{
    draft: ['order.update', 'order.confirm', 'order.cancel'],
    confirmed: ['order.fulfill', 'order.cancel', 'order.return'],
    processing: ['order.fulfill', 'order.cancel', 'order.return'],
    fulfilled: ['order.return'],
  }} related={(id) => [{ title: 'Payments', path: `/orders/${id}/payments`, columns: ['amount_paisa', 'method', 'status'] }, { title: 'Timeline', path: `/orders/${id}/activities`, columns: ['type', 'subject', 'created_at'] }]} />;
}
