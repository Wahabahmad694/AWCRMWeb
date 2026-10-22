"use client";

import { useActionState, useState } from "react";
import { Check, Copy, MailPlus } from "lucide-react";
import { inviteMember, type InviteState } from "@/app/team/actions";

const roles = [["admin", "Admin"], ["manager", "Manager"], ["sales", "Sales"], ["accountant", "Accountant"], ["viewer", "Viewer"], ["owner", "Owner"]];

export function TeamInviteForm({ organizationName }: { organizationName: string }) {
  const [state, action, pending] = useActionState(inviteMember, {} as InviteState);
  const [copiedToken, setCopiedToken] = useState("");
  return <section id="invite-member" className="team-invite-card"><div className="team-invite-heading"><span><MailPlus size={21} /></span><div><small>NEW INVITATION</small><h2>Invite a member</h2><p>Give someone access to {organizationName}.</p></div></div>
    <form action={action} className="team-invite-form"><div className="team-invite-fields"><label><span>Email address</span><input type="email" name="email" placeholder="name@example.com" disabled={pending} /><small>Enter an email, phone number, or both.</small></label><label><span>Phone number</span><input type="tel" name="phone" placeholder="+92 300 1234567" disabled={pending} /><small>Include the country code when possible.</small></label><label className="team-role-field"><span>Role *</span><select name="role" defaultValue="" required disabled={pending}><option value="">Choose a role…</option>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>The role controls what the member can access.</small></label></div>
      {state.error && <p className="team-invite-error" role="alert">{state.error}</p>}{state.success && <div className="team-invite-success" role="status"><strong><Check size={16} /> {state.success}</strong>{state.token && <div className="team-invite-token"><input aria-label="Invitation token" readOnly value={state.token} onFocus={event => event.currentTarget.select()} /><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(state.token ?? ""); setCopiedToken(state.token ?? ""); } catch { setCopiedToken(""); } }}>{copiedToken === state.token ? <Check size={15} /> : <Copy size={15} />}{copiedToken === state.token ? "Copied" : "Copy token"}</button></div>}<small>Invitation tokens are valid for 7 days. Share this one directly with the invited person.</small></div>}
      <div className="team-invite-footer"><span>Required fields are marked *</span><button type="submit" disabled={pending}><MailPlus size={16} />{pending ? "Creating invitation…" : "Create invitation"}</button></div></form>
  </section>;
}
