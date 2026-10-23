import Link from "next/link";
import { resourceReturnPath } from "@/lib/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import { Suspense } from "react";
import { OperationForm } from "@/components/shared/operation-form";
import { ApiError, apiRequest, getWorkspace, items, record } from "@/lib/api";
import { formatPaisa } from "@/lib/display";

type Column = { key: string; label: string; money?: boolean; fallbackKeys?: string[] };
type ResourceConfig = { title: string; description: string; path: string; columns: Column[]; search?: boolean; detailPath?: string; actions?: string[]; links?: { label: string; href: string }[]; paged?: boolean; rowActions?: string[]; idKey?: string; optionSources?: { operationId: string; fieldKey: string; path: string }[] };

type Props = { config: ResourceConfig; searchParams?: Promise<{ page?: string; search?: string }> };

function textValue(value: unknown, money?: boolean) {
  if (value === null || value === undefined || value === "") return "—";
  if (money && typeof value === "number") return formatPaisa(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return "—";
  return String(value);
}

function columnValue(row: Record<string, unknown>, column: Column) {
  for (const key of [column.key, ...(column.fallbackKeys ?? [])]) {
    const value = key.split(".").reduce<unknown>((current, part) => record(current)[part], row);
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return undefined;
}

export function ResourcePage({ config, searchParams }: Props) {
  return <Suspense fallback={<WorkspaceSkeleton title={config.title} />}>
    <ResourceContent config={config} searchParams={searchParams} />
  </Suspense>;
}

async function ResourceContent({ config, searchParams }: Props) {
  const params = await searchParams;
  const pageInput = typeof params?.page === "string" ? params.page : "1";
  const searchInput = typeof params?.search === "string" ? params.search : "";
  const page = Math.min(10000, Math.max(1, Number.parseInt(pageInput, 10) || 1));
  const search = searchInput.trim().slice(0, 100);
  let workspace: Awaited<ReturnType<typeof getWorkspace>>;
  try { workspace = await getWorkspace(resourceReturnPath(config.path)); }
  catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>{config.title}</h1><p>{config.description}</p></div></div><section className="panel resource-panel" aria-label={`${config.title} records`}><div className="resource-state" role="alert">{error.message}</div></section></div>;
  }
  let data: unknown = null;
  let organizationName = "";
  let errorMessage = "";
  try {
    data = workspace.organizationId ? await apiRequest(config.path, { token: workspace.token, organizationId: workspace.organizationId, query: config.paged === false ? undefined : { page, limit: 20, ...(config.search && search ? { search } : {}) } }) : null;
    organizationName = String(workspace.organization?.name ?? "");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) errorMessage = "Your role does not have access to this area.";
    else errorMessage = error instanceof Error ? error.message : "Unable to load records.";
  }
  const actionOptions: Record<string, Record<string, { value: string; label: string }[]>> = {};
  const optionErrors: string[] = [];
  for (const source of config.optionSources ?? []) {
    try {
      const optionsData = workspace.organizationId ? await apiRequest(source.path, { token: workspace.token, organizationId: workspace.organizationId }) : null;
      actionOptions[source.operationId] ??= {};
      actionOptions[source.operationId][source.fieldKey] = items(optionsData)
        .filter(item => typeof item.id === "string" && typeof item.name === "string")
        .map(item => ({ value: String(item.id), label: String(item.name) }));
    } catch (error) {
      actionOptions[source.operationId] ??= {};
      actionOptions[source.operationId][source.fieldKey] = [];
      optionErrors.push(error instanceof ApiError ? error.message : "Unable to load options.");
    }
  }
  const rows = items(data);
  const envelope = record(data);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  const total = typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
  const next = total !== undefined ? page * 20 < total : rows.length === 20;
  const query = (n: number) => `?page=${n}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">{organizationName || "WORKSPACE"}</div><h1>{config.title}</h1><p>{config.description}</p></div></div>
    {config.links && <nav className="context-links" aria-label="Related views">{config.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>}
    {optionErrors.length > 0 && <div className="notice" role="alert">Could not load form options: {optionErrors.join(" ")}</div>}
    {config.actions && config.actions.length > 0 && <div className="operation-grid">{config.actions.map(id => <OperationForm key={id} operationId={id} selectOptions={actionOptions[id]} />)}</div>}
    {config.search && <form className="resource-search" action="" method="get"><label htmlFor="resource-search">Search {config.title.toLowerCase()}</label><div><input id="resource-search" name="search" defaultValue={search} placeholder={`Search ${config.title.toLowerCase()}…`} /><button type="submit">Search</button></div></form>}
    <section className="panel resource-panel" aria-label={`${config.title} records`}>
      {errorMessage ? <div className="resource-state" role="alert">{errorMessage}</div> : !data ? <div className="resource-state">Select or create an organization to view records.</div> : rows.length === 0 ? <EmptyState title={search ? "No matching records" : `Your ${config.title.toLowerCase()} start here`} description={search ? "Try a different search term to find what you need." : config.actions?.length ? "Use the actions above to add your first record. Everything will be organized here." : "Records will appear here as your business gets moving."} /> : <div className="resource-table-wrap"><table className="resource-table"><thead><tr>{config.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}{config.rowActions && <th scope="col">Actions</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{config.columns.map(column => <td key={column.key}>{column.key === config.columns[0].key && config.detailPath && typeof row[config.idKey ?? "id"] === "string" ? <Link href={`${config.detailPath}/${row[config.idKey ?? "id"]}`}>{textValue(columnValue(row, column), column.money)}</Link> : /(^status$|_status$)/.test(column.key) ? <StatusBadge value={textValue(columnValue(row, column))} /> : textValue(columnValue(row, column), column.money)}</td>)}{config.rowActions && <td><div className="row-actions">{config.rowActions.map(id => typeof row.id === "string" ? <OperationForm key={id} operationId={id} entityId={row.id} defaults={row} /> : null)}</div></td>}</tr>)}</tbody></table></div>}
    </section>
    {config.paged !== false && rows.length > 0 && <nav className="pagination" aria-label="Pagination"><span>{total === undefined ? `Page ${page}` : `${total} records · Page ${page}`}</span><div>{page > 1 && <Link href={query(page - 1)}>Previous</Link>}{next && <Link href={query(page + 1)}>Next</Link>}</div></nav>}
  </div>;
}
