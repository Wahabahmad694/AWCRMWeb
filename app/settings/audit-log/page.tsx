import { ResourcePage } from "@/components/shared/resource-page";

export default function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <ResourcePage searchParams={searchParams} config={{
    title: "Audit log",
    description: "Review security and business changes across the workspace.",
    path: "/audit-logs",
    columns: [
      { key: "created_at", label: "Time" },
      { key: "action", label: "Action" },
      { key: "entity_type", label: "Record type" },
      { key: "entity_id", label: "Record ID" },
      { key: "actor.name", label: "Changed by", fallbackKeys: ["actor_name", "actor.email"] },
    ],
    links: [{ label: "Settings", href: "/settings" }],
  }} />;
}
