"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import styles from "./auth.module.css";

export function PasswordField({ name, label, newPassword = false, confirm = false }: { name: string; label: string; newPassword?: boolean; confirm?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [length, setLength] = useState(0);
  return <div className={styles.field}>
    <label htmlFor={name}>{label}</label>
    <div className={styles.inputWrap}>
      <LockKeyhole size={18} aria-hidden="true" />
      <input id={name} name={name} type={visible ? "text" : "password"} autoComplete={newPassword || confirm ? "new-password" : "current-password"} required minLength={newPassword ? 8 : undefined} maxLength={newPassword ? 128 : undefined} placeholder={confirm ? "Repeat your password" : newPassword ? "Create a password" : "Enter your password"} aria-describedby={newPassword ? `${name}-hint` : undefined} onChange={(event) => { setLength(event.target.value.length); event.target.setCustomValidity(""); (event.target.form?.elements.namedItem("confirm_password") as HTMLInputElement | null)?.setCustomValidity(""); }} />
      <button className={styles.passwordToggle} type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
    </div>
    {newPassword && <p className={styles.hint} id={`${name}-hint`}>{length >= 8 ? "✓ Minimum length met" : "Use at least 8 characters."}</p>}
  </div>;
}
