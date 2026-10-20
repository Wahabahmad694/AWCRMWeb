import { Inbox } from "lucide-react";

export function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
    <span className="empty-state-icon"><Inbox size={24} strokeWidth={1.5} aria-hidden="true" /></span>
    <h3>{title}</h3><p>{description}</p>
  </div>;
}
