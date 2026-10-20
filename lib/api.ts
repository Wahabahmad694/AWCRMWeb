import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

export const API_BASE = (process.env.NESTJS_API_BASE_URL || "https://aw-crm-mu.vercel.app/api/v1").replace(/\/$/, "");
export const ACCESS_COOKIE = "aw_access";
export const REFRESH_COOKIE = "aw_refresh";
export const ORG_COOKIE = "aw_organization";

type JsonRecord = Record<string, unknown>;
export type ApiFailure = { error?: { code?: string; message?: string; request_id?: string } };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function record(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

export function unwrap(value: unknown): JsonRecord {
  const outer = record(value);
  return record(outer.data ?? outer);
}

export function items(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(record);
  const outer = record(value);
  const nested = record(outer.data);
  for (const candidate of [outer.data, outer.items, outer.results, ...Object.values(nested), ...Object.values(outer)]) {
    if (Array.isArray(candidate)) return candidate.map(record);
  }
  return [];
}

export async function apiRequest(path: string, options: { method?: string; body?: unknown; token?: string; organizationId?: string; query?: Record<string, string | number | undefined>; idempotencyKey?: string } = {}) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid API path");
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.organizationId) headers.set("X-Organization-Id", options.organizationId);
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
  let response: Response;
  try {
    response = await fetch(url, { method: options.method ?? "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), cache: "no-store" });
  } catch {
    throw new ApiError(503, "api_unavailable", "The API is unavailable. Try again shortly.");
  }
  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = record(record(payload).error);
    throw new ApiError(response.status, String(error.code ?? "api_error"), String(error.message ?? `API request failed (${response.status}).`));
  }
  return payload;
}

export const getWorkspace = cache(async function getWorkspace() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) redirect(jar.get(REFRESH_COOKIE)?.value ? "/session/renew" : "/login");
  let me: unknown;
  try { me = await apiRequest("/auth/me", { token }); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/session/renew");
    throw error;
  }
  const rawOrganizations = await apiRequest("/organizations", { token });
  const organizations = items(rawOrganizations);
  const selected = jar.get(ORG_COOKIE)?.value;
  const organization = organizations.find((org) => org.id === selected) ?? organizations[0];
  return { token, me: unwrap(me), organizations, organization, organizationId: typeof organization?.id === "string" ? organization.id : undefined };
});

export async function workspaceRequest(path: string, query?: Record<string, string | number | undefined>) {
  const workspace = await getWorkspace();
  if (!workspace.organizationId) return { workspace, data: null };
  const data = await apiRequest(path, { token: workspace.token, organizationId: workspace.organizationId, query });
  return { workspace, data };
}
