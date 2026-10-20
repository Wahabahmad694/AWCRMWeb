"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { login, type LoginState } from "./actions";
import styles from "@/components/auth/auth.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="identifier">Email or phone</label>
        <div className={styles.inputWrap}>
          <Mail size={18} aria-hidden="true" />
          <input id="identifier" name="identifier" autoComplete="username" required minLength={3} placeholder="you@example.com" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <div className={styles.inputWrap}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" />
          <button className={styles.passwordToggle} type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      <button className={styles.submit} type="submit" disabled={pending}>
        <span>{pending ? "Signing in…" : "Sign in"}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
