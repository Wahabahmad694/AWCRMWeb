import { ResourcePage } from "@/components/shared/resource-page";

export default function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <ResourcePage searchParams={searchParams} config={{
    title: "WhatsApp contact log",
    description: "See messages opened from the CRM and the contact they were prepared for.",
    path: "/followups/log",
    columns: [
      { key: "created_at", label: "Opened" },
      { key: "customer.name", label: "Customer", fallbackKeys: ["lead.name", "contact_name"] },
      { key: "template.name", label: "Template", fallbackKeys: ["template_name"] },
      { key: "text", label: "Message" },
      { key: "related.type", label: "Context" },
    ],
    links: [{ label: "Activities", href: "/activities" }, { label: "Reminders", href: "/activities/reminders" }],
  }} />;
}
