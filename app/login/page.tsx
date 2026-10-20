import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <AuthShell title="Welcome back" description="Sign in to your business workspace." footer={<><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create account <ArrowUpRight size={14} aria-hidden="true" /></Link></>}><LoginForm /></AuthShell>;
}
