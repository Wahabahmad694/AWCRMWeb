import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, ORG_COOKIE, apiRequest, items } from "@/lib/api";
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
  let organizationName = "AW CRM";
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token) {
    try {
      const organizations = items(await apiRequest("/organizations", { token }));
      const selected = organizations.find(organization => organization.id === jar.get(ORG_COOKIE)?.value) ?? organizations[0];
      if (typeof selected?.name === "string" && selected.name.trim()) organizationName = selected.name;
    } catch { /* Keep the shell usable while the session is being renewed. */ }
  }
  return <AppShell signedIn={signedIn} organizationName={organizationName}>{children}</AppShell>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: 'try{if(localStorage.getItem("aw-theme")==="dark")document.documentElement.classList.add("dark")}catch{}' }} /></head><body><Suspense fallback={<div className="app-loading"><WorkspaceSkeleton /></div>}><WorkspaceShell>{children}</WorkspaceShell></Suspense></body></html>;
}
