import Link from "next/link";
import { ArrowRight, DatabaseZap } from "lucide-react";

export function ConnectionState({ title = "Ready for your business data", description = "Connect the NestJS API and authentication contract to load authorized records for this workspace." }: { title?: string; description?: string }) {
  return <div className="connection-state"><div className="connection-icon"><DatabaseZap size={25}/></div><h2>{title}</h2><p>{description}</p><Link href="/settings" className="subtle-link">View connection status <ArrowRight size={16}/></Link></div>;
}
