"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transitionLead } from "@/app/actions/new-modules";

type Customer = { id: string; name: string };

export function LeadActions({ leadId, version, archived, converted, customers }: { leadId: string; version: number; archived: boolean; converted: boolean; customers: Customer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");

  function run(operation: "archive" | "restore" | "convert") {
    if (operation === "archive" && !window.confirm("Archive this lead? It will leave the pipeline board.")) return;
    if (operation === "convert" && !window.confirm(customerId ? "Convert this lead and link it to the selected customer?" : "Convert this lead to a new customer?")) return;
    setError("");
    startTransition(async () => {
      const result = await transitionLead(leadId, operation, version, customerId || undefined);
      if (result.error) setError(result.error);
      else if (result.destination) router.push(result.destination);
      else router.refresh();
    });
  }

  return <div className="lead-detail-actions"><div className="module-actions">{!archived && !converted && <><label className="module-field">Convert to customer<select value={customerId} disabled={pending} onChange={event => setCustomerId(event.target.value)}><option value="">Create a new customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><button className="module-primary" type="button" disabled={pending} onClick={() => run("convert")}>Convert lead</button></>}{archived ? <button className="module-secondary" type="button" disabled={pending} onClick={() => run("restore")}>Restore lead</button> : !converted && <button className="module-danger" type="button" disabled={pending} onClick={() => run("archive")}>Archive lead</button>}</div>{error && <p role="alert" className="module-error">{error}</p>}</div>;
}
