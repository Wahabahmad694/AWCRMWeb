import { Suspense } from "react";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import { ApiError, apiRequest, getWorkspace, items, unwrap } from "@/lib/api";
import { OperationForm } from "@/components/shared/operation-form";

export default function Page() {
  return <Suspense fallback={<WorkspaceSkeleton title="Notifications" />}><NotificationsContent /></Suspense>;
}

async function NotificationsContent() {
  const workspace = await getWorkspace("/notifications");
  let rows: Record<string, unknown>[] = [];
  let unread = 0;
  let error = "";
  try { if (workspace.organizationId) { const [list,count] = await Promise.all([apiRequest("/notifications", { token:workspace.token, organizationId:workspace.organizationId, query:{page:1,limit:30} }),apiRequest("/notifications/unread-count", { token:workspace.token, organizationId:workspace.organizationId })]); rows = items(list); const countData = unwrap(count); unread = Number(countData.count ?? countData.unread_count ?? 0); } }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "Unable to load notifications."; }
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">INBOX</div><h1>Notifications</h1><p>{unread} unread · Updates from your organization.</p></div></div><div className="operation-grid"><OperationForm operationId="notification.readAll" /></div>{error && <div className="notice" role="alert">{error}</div>}<section className="panel notification-list">{rows.length ? rows.map((row,index) => <article key={String(row.id ?? index)}><div><strong>{String(row.title ?? row.type ?? "Notification")}</strong><p>{String(row.message ?? row.body ?? "")}</p></div>{typeof row.id === "string" && !row.read_at && <OperationForm operationId="notification.read" entityId={row.id} />}</article>) : <div className="resource-state">No notifications.</div>}</section></div>;
}
