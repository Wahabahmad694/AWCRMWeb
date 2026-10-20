"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, Package, Boxes, Wallet, Target, Receipt, ChartNoAxesCombined, ListTodo, UserRoundCog, Sparkles, Settings, Bell, Menu, X, ChevronRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "WORKSPACE" },
  { label: "Customers", href: "/customers", icon: Users, group: "WORKSPACE" },
  { label: "Orders", href: "/orders", icon: ShoppingBag, group: "WORKSPACE" },
  { label: "Products", href: "/products", icon: Package, group: "WORKSPACE" },
  { label: "Inventory", href: "/inventory", icon: Boxes, group: "WORKSPACE" },
  { label: "Payments", href: "/payments", icon: Wallet, group: "BUSINESS" },
  { label: "Sales targets", href: "/sales-targets", icon: Target, group: "BUSINESS" },
  { label: "Expenses", href: "/expenses", icon: Receipt, group: "BUSINESS" },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined, group: "BUSINESS" },
  { label: "Activities", href: "/activities", icon: ListTodo, group: "MANAGE" },
  { label: "Team", href: "/team", icon: UserRoundCog, group: "MANAGE" },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles, group: "MANAGE" },
  { label: "Settings", href: "/settings", icon: Settings, group: "MANAGE" },
];

function NavigationHint() {
  const { pending } = useLinkStatus();
  return <span className={`navigation-hint ${pending ? "is-pending" : ""}`}><LoaderCircle size={14} aria-hidden="true" />{pending && <span className="sr-only">Loading page</span>}</span>;
}

export function AppShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const current = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? { label: pathname === "/notifications" ? "Notifications" : "Workspace", href: pathname };
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>(".sidebar-close")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = sidebar.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [open]);
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) return <>{children}</>;

  return <div className="app-frame">
    <a href="#main-content" className="skip-link">Skip to content</a>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} tabIndex={-1} />}
    <aside ref={sidebar} id="workspace-navigation" className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Main navigation">
      <div className="brand"><Link href="/dashboard" onClick={() => setOpen(false)} className="brand-home" aria-label="AW CRM home"><span className="brand-mark" aria-hidden="true">AW<i /></span><div><strong>AW CRM<span className="brand-pro">WORKSPACE</span></strong><small>Built for your next chapter</small></div></Link><button className="sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <nav className="nav-list">{["WORKSPACE", "BUSINESS", "MANAGE"].map(group => <div className="nav-group" key={group}><div className="sidebar-caption">{group}</div>{navigation.filter(item => item.group === group).map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${current.href === href ? "active" : ""}`} aria-current={current.href === href ? "page" : undefined}><Icon size={18} strokeWidth={1.7}/><span>{label}</span>{href === "/ai-assistant" && <small className="nav-ai-tag">SOON</small>}<NavigationHint />{current.href === href && <ChevronRight size={14} className="nav-chevron"/>}</Link>)}</div>)}</nav>
      <div className="sidebar-bottom"><Link href="/ai-assistant" onClick={() => setOpen(false)} className="help-card"><Sparkles size={20}/><div><strong>A smarter way to work</strong><span>Meet your future AI copilot <ArrowUpRight size={12} /></span></div></Link><Link href="/settings" onClick={() => setOpen(false)} className="account-block"><div className="avatar-placeholder">AW</div><div><strong>AW CRM</strong><span>Business workspace</span></div><Settings size={16} className="account-settings" /></Link></div>
    </aside>
    <div className="workspace-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Open navigation" aria-controls="workspace-navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{current.label}</strong></div></div><div className="topbar-right"><span className={`environment-pill ${signedIn ? "is-connected" : ""}`}><span/> {signedIn ? "Signed in" : "Sign in required"}</span><span className="currency-pill">PKR</span><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={19}/></Link><Link href="/settings" className="avatar-placeholder top-avatar" aria-label="Workspace settings">AW</Link></div></header>
      <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
      <nav className="bottom-nav" aria-label="Mobile navigation">{[navigation[0],navigation[1],navigation[2],navigation[11]].map(({label,href,icon:Icon})=><Link key={href} href={href} className={current.href===href?"selected":""} aria-current={current.href===href?"page":undefined}><Icon size={21}/><span>{label === "AI Assistant" ? "AI Assistant" : label}</span></Link>)}<button aria-label="Open more navigation options" aria-controls="workspace-navigation" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={21}/><span>More</span></button></nav>
    </div>
  </div>;
}
