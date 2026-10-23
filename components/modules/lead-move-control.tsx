"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveLead } from "@/app/actions/new-modules";

type Stage = { id: string; name: string; kind: string };
export function LeadMoveControl({ leadId, version, currentStageId, stages }: { leadId: string; version: number; currentStageId: string; stages: Stage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function change(stageId: string) {
    const stage = stages.find(item => item.id === stageId);
    if (!stage || stage.id === currentStageId) return;
    let reason: string | undefined;
    if (stage.kind === "lost") { const answer = window.prompt("Why was this lead lost?", ""); if (answer === null) return; if (!answer.trim()) { setError("Please say why the lead was lost."); return; } reason = answer; }
    setError("");
    startTransition(async () => { const result = await moveLead(leadId, stageId, version, reason); if (result.error) setError(result.error); else router.refresh(); });
  }
  return <div className="lead-move"><label><span className="sr-only">Move lead to stage</span><select value={currentStageId} aria-label="Move lead to stage" disabled={pending} onChange={event => change(event.target.value)}><option value="">Move to stage…</option>{stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>{error && <small role="alert" className="module-error">{error}</small>}</div>;
}
