"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, Package, Boxes, Wallet, Target, Receipt, ChartNoAxesCombined, ListTodo, UserRoundCog, Sparkles, Settings, Bell, Search, Menu, X, ChevronRight, CircleHelp } from "lucide-react";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Sales targets", href: "/sales-targets", icon: Target },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Activities", href: "/activities", icon: ListTodo },
  { label: "Team", href: "/team", icon: UserRoundCog },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? navigation[0];
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) return <>{children}</>;

  return <div className="app-frame">
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Main navigation">
      <div className="brand"><span className="brand-mark">AW<span>.</span></span><div><strong>A.W CRM</strong><small>Business workspace</small></div><button className="sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="nav-list">{navigation.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${current.href === href ? "active" : ""}`} aria-current={current.href === href ? "page" : undefined}><Icon size={19} strokeWidth={1.9}/><span>{label}</span>{current.href === href && <ChevronRight size={15} className="nav-chevron"/>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><div><strong>Getting started</strong><span>Your business workspace.</span></div></div><div className="account-block"><div className="avatar-placeholder">AW</div><div><strong>A.W CRM</strong><span>Business account</span></div></div></div>
    </aside>
    <div className="workspace-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={22}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{current.label}</strong></div></div><div className="topbar-right"><span className="environment-pill"><span/> {signedIn ? "Connected" : "Sign in required"}</span><span className="currency-pill">PKR</span><button className="icon-button" aria-label="Search unavailable until API is connected" disabled><Search size={20}/></button><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={20}/></Link><span className="avatar-placeholder top-avatar">AW</span></div></header>
      <main className="main-content">{children}</main>
      <nav className="bottom-nav" aria-label="Mobile navigation">{[navigation[0],navigation[1],navigation[2],navigation[11]].map(({label,href,icon:Icon})=><Link key={href} href={href} className={current.href===href?"selected":""} aria-current={current.href===href?"page":undefined}><Icon size={21}/><span>{label === "AI Assistant" ? "AI Chat" : label}</span></Link>)}<button onClick={()=>setOpen(true)}><Menu size={21}/><span>More</span></button></nav>
    </div>
  </div>;
}
