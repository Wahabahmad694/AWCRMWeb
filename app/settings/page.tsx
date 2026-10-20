import { apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { logout, logoutEverywhere, selectOrganization } from "@/app/login/actions";
import { AccountForm } from "@/components/shared/account-form";
import { OperationForm } from "@/components/shared/operation-form";
import { PreferencesForm } from "./preferences-form";
import { RevokeSession } from "./session-action";

export default async function Page() {
  const workspace = await getWorkspace();
  const { organization, organizations, me, token, organizationId } = workspace;
  const [subscriptionResult, preferenceResult, sessionsResult] = await Promise.allSettled([
    organizationId ? apiRequest("/subscription", { token, organizationId }) : Promise.resolve(null),
    organizationId ? apiRequest("/notification-preferences", { token, organizationId }) : Promise.resolve(null),
    apiRequest("/auth/sessions", { token }),
  ]);
  let organizationDetail = organization ?? {};
  if (organizationId) { try { organizationDetail = unwrap(await apiRequest(`/organizations/${organizationId}`, { token })); } catch {} }
  const subscription = subscriptionResult.status === "fulfilled" ? unwrap(subscriptionResult.value) : {};
  const preferencesRaw = preferenceResult.status === "fulfilled" ? items(record(preferenceResult.value).preferences ?? preferenceResult.value) : [];
  const preferences = Object.fromEntries(preferencesRaw.map(item => [String(item.type),item.in_app === true]));
  const sessions = sessionsResult.status === "fulfilled" ? items(sessionsResult.value) : [];
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>Settings</h1><p>Account, organization and notifications.</p></div></div><div className="report-grid">
    <section className="panel report-card"><h2>Organization</h2><p>{String(organization?.name ?? "No organization selected")}</p>{organizations.length > 1 && <form action={selectOrganization} className="settings-form"><label htmlFor="organization_id">Switch organization</label><select id="organization_id" name="organization_id" defaultValue={String(organization?.id ?? "")}>{organizations.map(org => <option key={String(org.id)} value={String(org.id)}>{String(org.name)}</option>)}</select><button>Switch</button></form>}<OperationForm operationId="organization.create" />{organizationId && <OperationForm operationId="organization.update" defaults={organizationDetail} />}<OperationForm operationId="invitation.accept" /></section>
    <section className="panel report-card"><h2>Account</h2><p>{String(record(me.user).name ?? me.name ?? record(me.user).email ?? me.email ?? "Signed in")}</p><AccountForm kind="change" /><form action={logout}><button className="secondary-button">Sign out</button></form><form action={logoutEverywhere}><button className="secondary-button">Sign out everywhere</button></form></section>
    <section className="panel report-card"><h2>Subscription</h2><p>{String(subscription.plan ?? "Plan unavailable")} · {String(subscription.status ?? "Status unavailable")}</p></section>
    <section className="panel report-card"><h2>Notifications</h2><PreferencesForm current={preferences} /></section>
    <section className="panel report-card"><h2>Sessions</h2>{sessions.length ? <ul className="session-list">{sessions.map((session,index) => <li key={String(session.id ?? index)}><span>{String(session.device ?? session.user_agent ?? "Session")}</span>{typeof session.id === "string" && <RevokeSession id={session.id} />}</li>)}</ul> : <p>No session details available.</p>}</section>
  </div></div>;
}
