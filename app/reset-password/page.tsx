import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AccountForm } from "@/components/shared/account-form";

export default function Page() {
  return <AuthShell eyebrow="A FRESH START" title="New password" description="Use your reset code to choose a new password for your account." footer={<><Link href="/login">← Back to sign in</Link><Link href="/forgot-password">Request a new code</Link></>}><AccountForm kind="reset" /></AuthShell>;
}
