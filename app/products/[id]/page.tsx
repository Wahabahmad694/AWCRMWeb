import { ParamDetailPage } from "@/components/shared/param-detail-page";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParamDetailPage params={params} title="Products" apiPath="/products" back="/products" actions={['product.update', 'product.archive', 'product.restore', 'product.delete']} />;
}
