import { Suspense } from "react";
import { getWorkspace } from "@/lib/api";
import { AssistantChat } from "@/components/shared/assistant-chat";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

export default function Page() {
  return <Suspense fallback={<WorkspaceSkeleton title="AI Assistant" />}><AssistantContent /></Suspense>;
}
async function AssistantContent() {
  const workspace = await getWorkspace("/ai-assistant");
  return <AssistantChat organizationName={String(workspace.organization?.name ?? "WORKSPACE")} hasOrganization={Boolean(workspace.organizationId)} />;
}
