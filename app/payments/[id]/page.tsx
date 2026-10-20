import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Payments" apiPath="/payments" back="/payments" actions={['payment.reverse']} />;
}
