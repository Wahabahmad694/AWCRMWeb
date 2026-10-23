import Link from "next/link";
import { Suspense } from "react";
import { BellRing, Building2, Check, ChevronRight, CreditCard, KeyRound, Laptop, LogOut, Settings2, ShieldCheck, UserRound, Users } from "lucide-react";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import { apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";
import { logout, logoutEverywhere, selectOrganization } from "@/app/login/actions";
import { AccountForm } from "@/components/shared/account-form";
import { OperationForm } from "@/components/shared/operation-form";
import { PreferencesForm } from "./preferences-form";
import { RevokeSession } from "./session-action";

function label(value: unknown) { return typeof value === "string" && value.trim() ? value : "—"; }
export default function SettingsPage() {
  return <Suspense fallback={<WorkspaceSkeleton title="Settings" />}><SettingsContent /></Suspense>;
}
async function SettingsContent() {
  const workspace = await getWorkspace("/settings");
  const { organization, organizations, me, token, organizationId } = workspace;
  const [subscriptionResult, preferenceResult, sessionsResult, organizationResult] = await Promise.allSettled([
    organizationId ? apiRequest("/subscription", { token, organizationId }) : Promise.resolve(null),
    organizationId ? apiRequest("/notification-preferences", { token, organizationId }) : Promise.resolve(null),
    apiRequest("/auth/sessions", { token }),
    organizationId ? apiRequest(`/organizations/${organizationId}`, { token }) : Promise.resolve(null),
  ]);
  const organizationDetail = organizationResult.status === "fulfilled" && organizationResult.value ? unwrap(organizationResult.value) : organization ?? {};
  const subscription = subscriptionResult.status === "fulfilled" ? unwrap(subscriptionResult.value) : {};
  const preferencesRaw = preferenceResult.status === "fulfilled" ? items(record(preferenceResult.value).preferences ?? preferenceResult.value) : [];
  const preferences = Object.fromEntries(preferencesRaw.map(item => [String(item.type), item.in_app === true]));
  const sessions = sessionsResult.status === "fulfilled" ? items(sessionsResult.value) : [];
  const user = record(me.user);
  const name = label(user.name ?? me.name);
  const email = label(user.email ?? me.email);
  const orgName = label(organization?.name) === "—" ? "No organization selected" : String(organization?.name);
  const initials = orgName === "No organization selected" ? "AW" : orgName.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <div className="workspace-settings-page"><header className="workspace-settings-header"><div><div className="module-eyebrow">WORKSPACE / CONFIGURATION</div><h1>Settings<span>.</span></h1><p>Shape your workspace, account, and notifications.</p></div><Link href="/dashboard" className="workspace-settings-home">Back to dashboard <ChevronRight size={15} /></Link></header>
    <section className="workspace-settings-hero"><div className="workspace-settings-identity"><span className="workspace-settings-avatar">{initials}</span><div><span>ACTIVE WORKSPACE</span><h2>{orgName}</h2><p>{organizationId ? "Manage the settings that keep your business running." : "Create or select an organization to configure your workspace."}</p></div></div><span className="workspace-settings-hero-badge"><Check size={14} /> Workspace settings</span></section>
    <nav className="workspace-settings-nav" aria-label="Settings sections"><a href="#organization"><Building2 size={16} /> Organization</a><a href="#account"><UserRound size={16} /> Account</a><a href="#notifications"><BellRing size={16} /> Notifications</a><a href="#security"><ShieldCheck size={16} /> Security</a><Link href="/settings/pipeline">Pipeline stages</Link><Link href="/settings/message-templates">Message templates</Link><Link href="/settings/payment-accounts">Payment accounts</Link><Link href="/settings/audit-log">Audit log</Link><Link href="/settings/files">Files</Link><Link href="/imports">Imports</Link></nav>
    <div className="workspace-settings-layout"><div className="workspace-settings-main"><section id="organization" className="workspace-settings-card"><div className="workspace-settings-card-head"><span className="workspace-settings-icon blue"><Building2 size={20} /></span><div><span>WORKSPACE PROFILE</span><h2>Organization</h2><p>Business identity and the workspace your team uses.</p></div></div><div className="workspace-settings-details"><div><span>Organization name</span><strong>{orgName}</strong></div><div><span>Currency</span><strong>{label(organizationDetail.currency)}</strong></div><div><span>Timezone</span><strong>{label(organizationDetail.timezone)}</strong></div><div><span>Customer phone policy</span><strong>{label(organizationDetail.customer_phone_policy).replaceAll("_", " ")}</strong></div></div>{organizations.length > 1 && <form action={selectOrganization} className="workspace-settings-switch"><label htmlFor="organization_id">Switch organization</label><div><select id="organization_id" name="organization_id" defaultValue={String(organization?.id ?? "")}>{organizations.map(org => <option key={String(org.id)} value={String(org.id)}>{String(org.name)}</option>)}</select><button type="submit">Switch</button></div></form>}<div className="workspace-settings-operations"><OperationForm operationId="organization.create" />{organizationId && <OperationForm operationId="organization.update" defaults={organizationDetail} />}<OperationForm operationId="invitation.accept" /></div></section>
      <section id="notifications" className="workspace-settings-card"><div className="workspace-settings-card-head"><span className="workspace-settings-icon violet"><BellRing size={20} /></span><div><span>STAY INFORMED</span><h2>Notifications</h2><p>Choose the in-app updates that matter to your team.</p></div></div><PreferencesForm current={preferences} /></section>
      <section id="security" className="workspace-settings-card"><div className="workspace-settings-card-head"><span className="workspace-settings-icon teal"><Laptop size={20} /></span><div><span>ACCOUNT ACCESS</span><h2>Active sessions</h2><p>Review where your account is signed in.</p></div></div>{sessions.length ? <ul className="workspace-settings-sessions">{sessions.map((session, index) => <li key={String(session.id ?? index)}><span className="workspace-settings-session-icon"><Laptop size={17} /></span><div><strong>{label(session.device ?? session.user_agent) !== "—" ? label(session.device ?? session.user_agent) : "Session"}</strong><small>{label(session.created_at) !== "—" ? String(session.created_at).slice(0, 10) : "Signed-in device"}</small></div>{typeof session.id === "string" && <RevokeSession id={session.id} />}</li>)}</ul> : <p className="workspace-settings-empty">No session details available.</p>}</section></div>
      <aside className="workspace-settings-aside"><section id="account" className="workspace-settings-card"><div className="workspace-settings-card-head"><span className="workspace-settings-icon blue"><UserRound size={20} /></span><div><span>YOUR ACCOUNT</span><h2>Profile & password</h2><p>Keep your sign-in information secure.</p></div></div><div className="workspace-settings-user"><span><UserRound size={18} /></span><div><strong>{name === "—" ? "Signed in" : name}</strong><small>{email}</small></div></div><div className="workspace-settings-password"><div><KeyRound size={17} /><strong>Change password</strong></div><AccountForm kind="change" /></div></section>
      <section className="workspace-settings-card workspace-settings-plan"><span className="workspace-settings-icon amber"><CreditCard size={19} /></span><span>YOUR PLAN</span><h2>{label(subscription.plan) === "—" ? "Plan unavailable" : String(subscription.plan)}</h2><p>{label(subscription.status) === "—" ? "Subscription status unavailable" : `Status: ${String(subscription.status)}`}</p></section>
      <section className="workspace-settings-card workspace-settings-team"><span className="workspace-settings-icon teal"><Users size={19} /></span><h2>Working with a team?</h2><p>Manage members and invitations from the Team workspace.</p><Link href="/team">Go to team <ChevronRight size={15} /></Link></section>
      <section className="workspace-settings-card workspace-settings-signout"><span><Settings2 size={17} /> Session controls</span><form action={logout}><button type="submit"><LogOut size={15} /> Sign out</button></form><form action={logoutEverywhere}><button type="submit">Sign out everywhere</button></form></section></aside></div>
  </div>;
}
