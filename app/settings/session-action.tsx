"use client";
import { useActionState } from "react";
import { revokeSession, type AccountState } from "@/app/login/account-actions";
export function RevokeSession({ id }: { id:string }) { const [state, action, pending] = useActionState(revokeSession.bind(null,id),{} as AccountState); return <form action={action}><button className="secondary-button" disabled={pending}>Revoke</button>{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.success && <p role="status" className="form-success">{state.success}</p>}</form>; }
