import Link from "next/link";
import type { ReactNode } from "react";

export function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="module-header"><div><div className="module-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <Link className="module-primary" href={action.href}>{action.label}</Link>}</div>;
}

export function ModuleCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`module-card ${className}`}>{children}</section>;
}

export function ModuleEmpty({ title, description, action }: { title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="module-empty"><div className="module-empty-icon">◇</div><h2>{title}</h2><p>{description}</p>{action && <Link className="module-primary" href={action.href}>{action.label}</Link>}</div>;
}
