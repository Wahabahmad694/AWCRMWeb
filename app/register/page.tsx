import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AccountForm } from "@/components/shared/account-form";

export default function Page() {
  return <AuthShell eyebrow="YOUR NEXT CHAPTER STARTS HERE" title="Create your account" description="A few details, one connected workspace." footer={<Link href="/login">Already have an account? Sign in →</Link>}><AccountForm kind="register" /></AuthShell>;
}
