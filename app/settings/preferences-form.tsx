"use client";
import { useActionState } from "react";
import { savePreferences, type PreferenceState } from "./preference-actions";
const notificationTypes = ["order_confirmed","payment_recorded","low_stock","follow_up_due","member_joined"] as const;
export function PreferencesForm({ current }: { current: Record<string, boolean> }) {
  const [state, action, pending] = useActionState(savePreferences, {} as PreferenceState);
  return <form action={action} className="settings-form">{notificationTypes.map(type => <label className="check-row" key={type}><input type="checkbox" name={type} defaultChecked={current[type] ?? true} /><span>{type.replaceAll("_"," ")}</span></label>)}{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.success && <p role="status" className="form-success">{state.success}</p>}<button disabled={pending}>Save preferences</button></form>;
}
