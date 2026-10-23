"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveMessageTemplate, saveTemplate } from "@/app/actions/new-modules";
import { ModuleCard } from "./module-ui";

type Template = { id: string; key: string; name: string; context: string; locale: string; body: string; version: number; is_default: boolean };
const contexts = ["general", "lead", "quotation", "receivable", "order"];
const allowed: Record<string, string[]> = { receivable: ["customer_name", "business_name", "amount_due", "order_number"], quotation: ["customer_name", "business_name", "quotation_number", "valid_until", "quotation_total"], order: ["customer_name", "business_name", "order_number"], lead: ["customer_name", "business_name"], general: ["customer_name", "business_name", "amount_due"] };
const samples: Record<string, string> = { customer_name: "Ali Traders", business_name: "AW CRM", amount_due: "12,500", quotation_number: "QUO-2026-000012", quotation_total: "18,750", valid_until: "05 Oct 2026", order_number: "ORD-2026-000012" };

function TemplateForm({ template, onDone }: { template?: Template; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveTemplate, {});
  const [body, setBody] = useState(template?.body ?? "Hello {{customer_name}}, this is a follow-up from {{business_name}}.");
  const [context, setContext] = useState(template?.context ?? "general");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const handled = useRef(false);
  useEffect(() => { if (state.destination && !handled.current) { handled.current = true; router.refresh(); onDone(); } }, [state.destination, router, onDone]);
  const tokens = allowed[context] ?? [];
  const unknown = [...body.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]).filter(token => !tokens.includes(token));
  const preview = body.replace(/{{\s*([^{}]+?)\s*}}/g, (_, token: string) => samples[token] ?? `{{${token}}}`);
  function insert(token: string) { const input = textarea.current; const start = input?.selectionStart ?? body.length; const end = input?.selectionEnd ?? body.length; setBody(body.slice(0, start) + `{{${token}}}` + body.slice(end)); requestAnimationFrame(() => input?.focus()); }
  return <div className="template-layout"><ModuleCard><h2>{template ? `Edit ${template.name}` : "New template"}</h2><form action={action} className="template-form">{template && <><input type="hidden" name="template_id" value={template.id} /><input type="hidden" name="version" value={template.version} /><input type="hidden" name="context" value={template.context} /><input type="hidden" name="locale" value={template.locale} /></>}<div className="module-grid-two"><label className="module-field">Name<input name="name" required maxLength={100} dir="auto" defaultValue={template?.name} placeholder="Payment reminder" /></label><label className="module-field">Key<input name="key" required readOnly={Boolean(template)} pattern={template ? undefined : "custom_[a-z0-9_]+"} defaultValue={template?.key} placeholder="custom_payment_reminder" /></label><label className="module-field">Context<select name="context" value={context} disabled={Boolean(template)} onChange={event => setContext(event.target.value)}>{contexts.map(item => <option value={item} key={item}>{item}</option>)}</select></label><label className="module-field">Language<select name="locale" defaultValue={template?.locale ?? "en"} disabled={Boolean(template)}><option value="en">English</option><option value="ur-Latn">Roman Urdu</option></select></label></div><label className="module-field">Message<textarea ref={textarea} name="body" dir="auto" rows={7} maxLength={1000} required value={body} onChange={event => setBody(event.target.value)} /></label><div className="token-list">{tokens.map(token => <button type="button" key={token} onClick={() => insert(token)}>{`{{${token}}}`}</button>)}</div><p className="module-hint">{body.length} / 1000 characters</p>{unknown.length > 0 && <p role="alert" className="module-error">Unknown placeholders for {context}: {unknown.join(", ")}</p>}{state.error && <p role="alert" className="module-error">{state.error}</p>}<button type="submit" className="module-primary" disabled={pending || !body.trim() || unknown.length > 0}>{pending ? "Saving…" : template ? "Save changes" : "Create template"}</button></form></ModuleCard><ModuleCard><h2>Live preview</h2><p className="module-muted">Sample values for {context} messages.</p><div className="template-preview" dir="auto">{preview}</div></ModuleCard></div>;
}

export function TemplateEditor({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Template | undefined>();
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const visible = templates.filter(template => filter === "all" || template.context === filter);
  function archive(template: Template) { if (!window.confirm(`Archive ${template.name}?`)) return; startTransition(async () => { const result = await archiveMessageTemplate(template.id); if (result.error) setError(result.error); else { if (selected?.id === template.id) setSelected(undefined); setError(""); router.refresh(); } }); }
  return <div><nav className="module-chips" aria-label="Template context">{["all", ...contexts].map(context => <button type="button" key={context} className={filter === context ? "active" : ""} onClick={() => setFilter(context)}>{context === "all" ? "All" : context}</button>)}</nav><TemplateForm key={selected?.id ?? "new"} template={selected} onDone={() => setSelected(undefined)} /><ModuleCard><h2>Saved templates</h2>{error && <p role="alert" className="module-error">{error}</p>}{visible.length === 0 ? <p className="module-state">No templates in this context.</p> : <div className="module-table-scroll"><table className="module-table"><thead><tr><th>Name</th><th>Context</th><th>Language</th><th>Message</th><th>Actions</th></tr></thead><tbody>{visible.map(template => <tr key={template.id}><td>{template.name}{template.is_default && <small className="inline-tag">Default</small>}</td><td>{template.context}</td><td>{template.locale === "ur-Latn" ? "Roman Urdu" : "English"}</td><td dir="auto">{template.body}</td><td><div className="module-actions"><button type="button" className="module-secondary" onClick={() => setSelected(template)}>Edit</button><button type="button" className="module-danger" disabled={pending} onClick={() => archive(template)}>Archive</button></div></td></tr>)}</tbody></table></div>}</ModuleCard></div>;
}
