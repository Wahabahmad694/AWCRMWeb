import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Expenses" apiPath="/expenses" back="/expenses" actions={['expense.update', 'expense.void']} />;
}
