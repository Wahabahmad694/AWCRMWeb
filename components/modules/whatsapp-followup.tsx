"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { logFollowup, renderFollowup } from "@/app/actions/new-modules";
import { buildWaUrl, formatPhonePk } from "@/lib/whatsapp";

type Template = { id: string; name: string; language: string };
export function WhatsAppFollowup({ targetType, targetId, phone, optedOut, context, relatedId, templates }: { targetType: "customer" | "lead"; targetId: string; phone: string; optedOut?: boolean; context: string; relatedId?: string; templates: Template[] }) {
  const [templateId, setTemplateId] = useState("");
  const [text, setText] = useState("");
  const [renderedPhone, setRenderedPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("92") && digits.length === 12 ? `+${digits}` : digits.startsWith("0") && digits.length === 11 ? `+92${digits.slice(1)}` : phone;
  const valid = /^\+92\d{10}$/.test(normalized);
  const disabledReason = optedOut ? "Opted out of WhatsApp" : !valid ? "Add a mobile number" : templates.length === 0 ? "No templates available" : "";
  function preview() {
    setError(""); setMessage("");
    startTransition(async () => { const result = await renderFollowup({ targetType, targetId, context, templateId, relatedId }); if (result.error) setError(result.error); else { setText(result.text ?? ""); setRenderedPhone(result.phone || normalized); } });
  }
  function open() {
    try { window.open(buildWaUrl(renderedPhone || normalized, text), "_blank", "noopener,noreferrer"); setMessage("WhatsApp opened. Press send in WhatsApp to deliver."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Invalid phone number."); return; }
    startTransition(async () => { const result = await logFollowup({ targetType, targetId, context, templateId, relatedId, text }); if (result.error) setError(`WhatsApp opened, but the contact log could not be saved: ${result.error}`); });
  }
  return <section className="module-card wa-followup"><h2><MessageCircle size={19} /> WhatsApp follow-up</h2><p className="module-muted">Preview the message before opening WhatsApp.</p><div className="module-grid-two"><label className="module-field">Template<select value={templateId} onChange={event => { setTemplateId(event.target.value); setText(""); }} disabled={Boolean(disabledReason)}><option value="">Choose template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name} · {template.language}</option>)}</select></label><div className="module-field"><span>Recipient</span><strong>{valid ? formatPhonePk(normalized) : "No valid mobile number"}</strong></div></div>{disabledReason && <p className="module-hint">{disabledReason}</p>}<div className="module-actions"><button type="button" className="module-secondary" disabled={Boolean(disabledReason) || !templateId || pending} onClick={preview}>{pending ? "Loading…" : "Preview message"}</button></div>{text && <div className="wa-preview"><label className="module-field">Message<textarea dir="auto" value={text} maxLength={1000} rows={6} onChange={event => setText(event.target.value)} /></label><span>{text.length} / 1000 characters</span><button type="button" className="module-primary" disabled={!text.trim() || pending} onClick={open}>Open WhatsApp</button></div>}{error && <p role="alert" className="module-error">{error}</p>}{message && <p role="status" className="module-success">{message}</p>}</section>;
}
