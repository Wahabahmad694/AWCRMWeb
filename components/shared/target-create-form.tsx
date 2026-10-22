"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, CircleUserRound, Target, Wallet } from "lucide-react";
import { runOperation, type OperationState } from "@/app/actions/operations";

type Member = { id: string; name: string; detail: string };

export function TargetCreateForm({ members, memberError, memberLimitReached }: { members: Member[]; memberError?: string; memberLimitReached: boolean }) {
  const [scope, setScope] = useState<"user" | "organization">("user");
  const [state, action, pending] = useActionState(runOperation.bind(null, "target.create", undefined), {} as OperationState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state]);
  return <section id="create-target" className="targets-create"><div className="targets-create-heading"><span><Target size={22} /></span><div><small>NEW TARGET</small><h2>Create a sales target</h2><p>Define a measurable goal for the month ahead.</p></div></div>
    <form ref={formRef} action={action} className="targets-form"><div className="targets-form-grid">
      <label><span>Scope *</span><select name="scope" value={scope} onChange={event => setScope(event.target.value as "user" | "organization")} disabled={pending}><option value="user">Team member</option><option value="organization">Entire organization</option></select><small>Choose who this target is for.</small></label>
      {scope === "user" ? <label><span><CircleUserRound size={15} /> Team member *</span><select name="user_id" defaultValue="" required disabled={pending || members.length === 0}><option value="">Select a team member…</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}{member.detail ? ` · ${member.detail}` : ""}</option>)}</select><small>{memberError ? `Team members could not be loaded: ${memberError}` : members.length === 0 ? "Invite a team member first." : memberLimitReached ? "More team members exist than can be listed here." : "The selected member's user ID is sent with the target."}</small></label> : <div className="targets-org-note"><UsersIcon /><div><strong>Organization wide target</strong><span>Progress is measured across your workspace.</span></div></div>}
      <label><span>Target name</span><input name="name" placeholder="e.g. October sales goal" disabled={pending} /></label>
      <label><span><CalendarDays size={15} /> Month *</span><input name="month" type="month" required disabled={pending} /></label>
      <label className="targets-amount-field"><span><Wallet size={15} /> Target amount (PKR) *</span><div className="targets-money-input"><strong>Rs</strong><input name="amount_paisa" type="number" step="0.01" min="0.01" inputMode="decimal" placeholder="0.00" required disabled={pending} /></div><small>Enter the target in rupees.</small></label>
    </div>{state.error && <p role="alert" className="targets-form-error">{state.error}</p>}{state.success && <p role="status" className="targets-form-success">Target created. You can add another below.</p>}<div className="targets-form-footer"><span>Required fields are marked *</span><button disabled={pending || (scope === "user" && members.length === 0)} type="submit"><Target size={16} /> {pending ? "Creating…" : "Create target"}</button></div></form>
  </section>;
}

function UsersIcon() { return <CircleUserRound size={19} />; }
