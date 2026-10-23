import { ModuleCard, ModuleHeader } from "@/components/modules/module-ui";
import { TemplateEditor } from "@/components/modules/template-editor";
import { moduleList, value } from "@/lib/module-data";
import { record } from "@/lib/api";

export default async function Page() {
  const result = await moduleList("/message-templates");
  const raw = Array.isArray(result.data.templates) ? result.data.templates.map(record) : result.rows;
  const templates = raw.map(row => ({ id: String(row.id), key: value(row, "key"), name: value(row, "name"), context: String(row.context ?? "general"), locale: String(row.locale ?? "en"), body: String(row.body ?? ""), version: Number(row.version ?? 0), is_default: row.is_default === true })).filter(row => row.id);
  return <div className="module-page"><ModuleHeader eyebrow="SETTINGS / WHATSAPP" title="Message templates" description="Create and edit follow-up messages with a live preview." />{result.error ? <ModuleCard><p role="alert">{result.error}</p></ModuleCard> : <TemplateEditor templates={templates} />}</div>;
}
