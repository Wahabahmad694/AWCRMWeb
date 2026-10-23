"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transitionQuotation } from "@/app/actions/new-modules";
import { ModuleCard } from "./module-ui";

export function QuotationActions({ id, status, version, expired }: { id: string; status: string; version: number; expired?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const actions = status === "draft" ? ["send", "duplicate", "delete"] : status === "sent" && expired ? ["reject", "duplicate"] : status === "sent" ? ["accept", "reject", "convert", "duplicate"] : status === "accepted" ? ["convert", "duplicate"] : ["duplicate"];
  function run(operation: string) {
    let reason: string | undefined;
    if (operation === "reject") { const answer = window.prompt("Reason for rejection (optional)"); if (answer === null) return; reason = answer; }
    if (["convert", "delete"].includes(operation) && !window.confirm(operation === "convert" ? "Create a draft order from this quotation? Stock is not reserved until the order is confirmed." : "Delete this draft quotation?")) return;
    setError("");
    startTransition(async () => { const result = await transitionQuotation(id, operation, version, reason); if (result.error) setError(result.error); else if (result.destination) router.push(result.destination); else router.refresh(); });
  }
  return <ModuleCard><h2>Actions</h2>{expired && status === "sent" && <p className="module-hint">This quotation has expired. Duplicate it to make a fresh offer.</p>}<div className="module-actions">{status === "draft" && <Link className="module-secondary" href={`/quotations/${id}/edit`}>Edit</Link>}{actions.map(operation => <button className={operation === "delete" ? "module-danger" : "module-secondary"} key={operation} disabled={pending} onClick={() => run(operation)}>{operation[0].toUpperCase() + operation.slice(1)}</button>)}<Link className="module-secondary" href={`/quotations/${id}/print`}>Print</Link></div>{error && <p role="alert" className="module-error">{error}</p>}</ModuleCard>;
}
