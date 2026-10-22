import { ActivityView } from "@/components/shared/activity-view";
export default function Page({ searchParams }: { searchParams: Promise<{page?: string; search?: string; type?: string; view?: string}> }) { return <ActivityView mode="activities" searchParams={searchParams} />; }
