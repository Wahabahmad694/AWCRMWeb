import StatementPage from "../page";
import { PrintTrigger } from "@/components/modules/print-trigger";
export default function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  return <><StatementPage params={params} searchParams={searchParams} /><PrintTrigger /></>;
}
