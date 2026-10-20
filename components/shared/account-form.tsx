"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Building2, KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { register, forgotPassword, resetPassword, changePassword, type AccountState } from "@/app/login/account-actions";
import { PasswordField } from "@/components/auth/password-field";
import styles from "@/components/auth/auth.module.css";

const actions = { register, forgot: forgotPassword, reset: resetPassword, change: changePassword };
const fields = {
  register: [
    { name: "name", label: "Full name", type: "text", placeholder: "Your full name", autoComplete: "name", icon: UserRound },
    { name: "organization_name", label: "Organization", type: "text", placeholder: "Your business name", autoComplete: "organization", icon: Building2 },
    { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email", icon: Mail },
    { name: "phone", label: "Phone", type: "tel", placeholder: "+92 300 1234567", autoComplete: "tel", icon: Phone },
  ],
  forgot: [{ name: "identifier", label: "Email or phone", type: "text", placeholder: "you@example.com", autoComplete: "username", icon: Mail }],
  reset: [{ name: "token", label: "Reset code", type: "text", placeholder: "Paste the code you received", autoComplete: "one-time-code", icon: KeyRound }],
  change: [],
};

export function AccountForm({ kind }: { kind: keyof typeof actions }) {
  const [state, action, pending] = useActionState(actions[kind], {} as AccountState);
  const label = kind === "register" ? "Create account" : kind === "forgot" ? "Send reset code" : kind === "reset" ? "Reset password" : "Change password";

  return <form action={action} className={`${styles.form} ${kind === "register" ? styles.registerForm : ""}`} onSubmit={(event) => {
    const form = event.currentTarget;
    if (kind === "register") {
      const email = form.elements.namedItem("email") as HTMLInputElement;
      const phone = form.elements.namedItem("phone") as HTMLInputElement;
      if (!email.value.trim() && !phone.value.trim()) { event.preventDefault(); email.setCustomValidity("Enter an email address or a phone number."); email.reportValidity(); return; }
    }
    if (kind !== "forgot") {
      const password = form.elements.namedItem(kind === "register" ? "password" : "new_password") as HTMLInputElement;
      const confirmation = form.elements.namedItem("confirm_password") as HTMLInputElement;
      if (password.value !== confirmation.value) { event.preventDefault(); confirmation.setCustomValidity("Your passwords do not match."); confirmation.reportValidity(); }
    }
  }}>
    {fields[kind].map(({ name, label, type, placeholder, autoComplete, icon: Icon }) => <div className={styles.field} key={name}>
      <label htmlFor={name}>{label}{kind === "register" && ["email", "phone"].includes(name) && <span className={styles.optional}> · either required</span>}</label>
      <div className={styles.inputWrap}><Icon size={18} aria-hidden="true" /><input id={name} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} required={!["email", "phone"].includes(name)} minLength={name === "token" ? 20 : ["name", "organization_name"].includes(name) ? 2 : undefined} maxLength={name === "phone" ? 32 : ["name", "organization_name"].includes(name) ? 120 : undefined} onInput={(event) => { const form = event.currentTarget.form; (form?.elements.namedItem("email") as HTMLInputElement | null)?.setCustomValidity(""); }} /></div>
    </div>)}
    {kind === "change" && <PasswordField name="current_password" label="Current password" />}
    {kind !== "forgot" && <><PasswordField name={kind === "register" ? "password" : "new_password"} label={kind === "register" ? "Password" : "New password"} newPassword /><PasswordField name="confirm_password" label="Confirm password" confirm /></>}
    {state.error && <p className={styles.error} role="alert">{state.error}</p>}
    {state.success && <div className={styles.success} role="status"><p>{state.success}</p>{kind === "forgot" && <Link href="/reset-password">Enter your reset code →</Link>}{kind === "reset" && <Link href="/login">Continue to sign in →</Link>}</div>}
    <button className={styles.submit} disabled={pending} type="submit"><span>{pending ? "Please wait…" : label}</span><ArrowRight size={18} aria-hidden="true" /></button>
  </form>;
}
