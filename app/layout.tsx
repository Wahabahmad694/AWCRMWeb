import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import "./globals.css";

export const metadata: Metadata = {
  title: "AW CRM | AI-Powered Business Management Platform",
  description: "Manage orders, products, inventory, payments, and business growth in one connected AW CRM workspace.",
};

async function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const signedIn = Boolean(jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value);
  return <AppShell signedIn={signedIn}>{children}</AppShell>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Suspense fallback={<div className="app-loading"><WorkspaceSkeleton /></div>}><WorkspaceShell>{children}</WorkspaceShell></Suspense></body></html>;
}
