"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePipelineStage, reorderStages } from "@/app/actions/new-modules";

type Stage = { id: string; name: string; color: string; kind: string; count: number };

export function StageOrder({ stages }: { stages: Stage[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(stages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [moveTo, setMoveTo] = useState("");

  function move(index: number, direction: -1 | 1) { const next = [...rows]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setRows(next); }
  function save() { startTransition(async () => { const result = await reorderStages(rows.map(row => row.id)); if (result.error) setError(result.error); else { setError(""); router.refresh(); } }); }
  function remove(stage: Stage) {
    if (stage.count > 0 && !moveTo) { setError("Choose where to move this stage’s leads."); return; }
    startTransition(async () => {
      const result = await deletePipelineStage(stage.id, stage.count > 0 ? moveTo : undefined);
      if (result.error) setError(result.error);
      else { setRows(current => current.filter(row => row.id !== stage.id)); setDeletingId(""); setError(""); router.refresh(); }
    });
  }

  return <div className="stage-manager"><ol>{rows.map((stage, index) => {
    const destinations = rows.filter(row => row.id !== stage.id);
    const canDelete = rows.filter(row => row.kind === stage.kind).length > 1;
    return <li key={stage.id}><div className="stage-row"><span className="stage-dot" style={{ background: stage.color || "#3b82f6" }} /><strong>{stage.name}</strong><small>{stage.kind} · {stage.count} leads</small><div className="stage-row-actions"><button type="button" disabled={pending || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${stage.name} up`}>↑</button><button type="button" disabled={pending || index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${stage.name} down`}>↓</button><button type="button" disabled={pending || !canDelete} title={!canDelete ? `The last ${stage.kind} stage cannot be deleted` : undefined} onClick={() => { setDeletingId(stage.id); setMoveTo(""); setError(""); }} aria-label={`Delete ${stage.name}`}>×</button></div></div>{deletingId === stage.id && <div className="stage-delete-panel"><p>Delete <strong>{stage.name}</strong>? {stage.count ? `Move its ${stage.count} leads first.` : "This stage has no leads."}</p>{stage.count > 0 && <label>Move leads to<select value={moveTo} onChange={event => setMoveTo(event.target.value)}><option value="">Choose a stage</option>{destinations.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}<div><button type="button" disabled={pending} onClick={() => setDeletingId("")}>Cancel</button><button type="button" className="module-danger" disabled={pending || (stage.count > 0 && !moveTo)} onClick={() => remove(stage)}>Delete stage</button></div></div>}</li>;
  })}</ol>{error && <p role="alert" className="module-error">{error}</p>}<button type="button" className="module-primary" disabled={pending || rows.every((stage, index) => stage.id === stages[index]?.id)} onClick={save}>{pending ? "Saving…" : "Save stage order"}</button></div>;
}
