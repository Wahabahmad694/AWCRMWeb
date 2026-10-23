import { ApiError, apiRequest, getWorkspace, items, record, unwrap } from "@/lib/api";

export type ModuleResult = { rows: Record<string, unknown>[]; data: Record<string, unknown>; error?: string; forbidden?: boolean };

export async function moduleList(path: string, query?: Record<string, string | number | undefined>): Promise<ModuleResult> {
  const workspace = await getWorkspace(path);
  if (!workspace.organizationId) return { rows: [], data: {}, error: "Select an organization to continue." };
  try {
    const response = await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query });
    return { rows: items(response), data: unwrap(response) };
  } catch (error) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return { rows: [], data: {}, forbidden, error: forbidden ? "You do not have permission to view this area." : error instanceof Error ? error.message : "Unable to load records." };
  }
}

export async function moduleDetail(path: string): Promise<{ data: Record<string, unknown>; error?: string }> {
  const workspace = await getWorkspace(path);
  if (!workspace.organizationId) return { data: {}, error: "Select an organization to continue." };
  try {
    return { data: unwrap(await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId })) };
  } catch (error) {
    return { data: {}, error: error instanceof ApiError && error.status === 403 ? "You do not have permission to view this record." : error instanceof Error ? error.message : "Unable to load record." };
  }
}

export function value(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const found = key.split(".").reduce<unknown>((current, part) => record(current)[part], data);
    if (typeof found === "string" && found) return found;
    if (typeof found === "number") return String(found);
  }
  return "—";
}
