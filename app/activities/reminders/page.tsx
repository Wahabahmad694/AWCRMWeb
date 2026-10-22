import { ActivityView } from "@/components/shared/activity-view";
export default function Page({ searchParams }: { searchParams: Promise<{page?: string; search?: string; view?: string}> }) { return <ActivityView mode="reminders" searchParams={searchParams} />; }
