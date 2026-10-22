import { InventoryView } from "@/components/shared/inventory-view";
export default function Page({ searchParams }: { searchParams: Promise<{page?: string; search?: string; view?: string; sort?: string}> }) { return <InventoryView mode="stock" searchParams={searchParams} />; }
