import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AccountForm } from "@/components/shared/account-form";

export default function Page() {
  return <AuthShell eyebrow="LET’S GET YOU BACK IN" title="Forgot password?" description="Enter your email or phone and we’ll help you reset your password." footer={<><Link href="/login">← Back to sign in</Link><Link href="/reset-password">I have a reset code</Link></>}><AccountForm kind="forgot" /></AuthShell>;
}
