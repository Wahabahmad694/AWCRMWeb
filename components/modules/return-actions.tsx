"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transitionReturn } from "@/app/actions/new-modules";

export function ReturnActions({ id, version }: { id: string; version: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function run(operation: "complete" | "cancel") {
    const confirmed = window.confirm(operation === "complete" ? "Complete this return? This will update stock and create a credit note or refund. It cannot be undone." : "Cancel this draft return?");
    if (!confirmed) return;
    startTransition(async () => { const result = await transitionReturn(id, operation, version); if (result.error) setError(result.error); else router.refresh(); });
  }
  return <div className="module-actions"><button className="module-primary" disabled={pending} onClick={() => run("complete")}>{pending ? "Working…" : "Complete return"}</button><button className="module-danger" disabled={pending} onClick={() => run("cancel")}>Cancel draft</button>{error && <p role="alert" className="module-error">{error}</p>}</div>;
}
