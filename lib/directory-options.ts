import "server-only";
import { apiRequest, items, record } from "@/lib/api";

function totalFrom(value: unknown) {
  const envelope = record(value);
  const nested = record(envelope.data);
  const meta = record(envelope.meta ?? nested.meta);
  const pagination = record(meta.pagination ?? nested.pagination ?? envelope.pagination);
  return typeof meta.total === "number" ? meta.total : typeof pagination.total === "number" ? pagination.total : typeof envelope.total === "number" ? envelope.total : undefined;
}

export async function directoryOptions(path: "/customers" | "/orders", token: string, organizationId: string) {
  const limit = 100;
  const maxPages = 10;
  const first = await apiRequest(path, { token, organizationId, query: { page: 1, limit } });
  const rows = items(first);
  const total = totalFrom(first);
  if (total !== undefined && total > rows.length) {
    const lastPage = Math.min(maxPages, Math.ceil(total / Math.max(1, rows.length)));
    const more = await Promise.allSettled(Array.from({ length: lastPage - 1 }, (_, index) => apiRequest(path, { token, organizationId, query: { page: index + 2, limit } })));
    for (const result of more) if (result.status === "fulfilled") rows.push(...items(result.value));
  } else if (total === undefined && rows.length === limit) {
    for (let page = 2; page <= maxPages; page++) {
      const next = items(await apiRequest(path, { token, organizationId, query: { page, limit } }));
      rows.push(...next);
      if (next.length < limit) break;
    }
  }
  return { rows, limited: total !== undefined ? rows.length < total : rows.length >= limit * maxPages };
}
