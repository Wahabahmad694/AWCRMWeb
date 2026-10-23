import Link from "next/link";
import { ModuleHeader } from "@/components/modules/module-ui";
import { moduleDetail, moduleList } from "@/lib/module-data";
import { record } from "@/lib/api";
import { ImportWizard } from "@/components/modules/import-wizard";

export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ job?: string; step?: string; page?: string }> }) {
  const { kind } = await params;
  if (kind !== "customers" && kind !== "products") return <div className="module-page"><ModuleHeader eyebrow="ADMIN / IMPORT" title="Unknown import type" description="Choose customers or products." /><Link href="/imports">Back to imports</Link></div>;
  const query = await searchParams;
  const job = query.job ?? "";
  const step = job ? Math.min(4, Math.max(2, Number(query.step ?? 2))) : 1;
  const [detail, rows] = job ? await Promise.all([moduleDetail(`/imports/${encodeURIComponent(job)}`), moduleList(`/imports/${encodeURIComponent(job)}/rows`, { page: Number(query.page ?? 1), limit: 50 })]) : [{ data: {} }, { rows: [] }];
  const data = record(detail.data);
  return <div className="module-page"><ModuleHeader eyebrow="ADMIN / IMPORT" title={`Import ${kind}`} description="Upload a CSV, map fields, review rows, then commit." /><ImportWizard key={job || kind} kind={kind} jobId={job} step={step} job={data} rows={rows.rows} /><div className="module-actions"><Link className="module-secondary" href="/imports">Import history</Link></div></div>;
}
