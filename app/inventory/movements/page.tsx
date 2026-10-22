import { InventoryView } from "@/components/shared/inventory-view";
export default function Page({ searchParams }: { searchParams: Promise<{page?: string; search?: string}> }) { return <InventoryView mode="movements" searchParams={searchParams} />; }
