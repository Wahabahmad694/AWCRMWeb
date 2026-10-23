"use server";

import { z } from "zod";
import { ApiError, apiRequest, getWorkspace, record, unwrap } from "@/lib/api";

export type UploadTicket = { error?: string; uploadUrl?: string; fileUrl?: string; key?: string; method?: string; headers?: Record<string, string> };

const requestSchema = z.object({
  purpose: z.enum(["product_image", "receipt", "document"]),
  filename: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(100),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
});

export async function requestUpload(input: { purpose: string; filename: string; contentType: string; sizeBytes: number }): Promise<UploadTicket> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { error: "Choose a supported file no larger than 20 MB." };
  const workspace = await getWorkspace("/settings/files");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const response = unwrap(await apiRequest("/files/uploads", {
      method: "POST",
      token: workspace.token,
      organizationId: workspace.organizationId,
      body: { purpose: parsed.data.purpose, filename: parsed.data.filename, content_type: parsed.data.contentType, size_bytes: parsed.data.sizeBytes },
    }));
    const upload = record(response.upload);
    const uploadUrl = response.upload_url ?? response.signed_url ?? upload.url;
    if (typeof uploadUrl !== "string" || !uploadUrl.startsWith("http")) return { error: "The API did not return a usable upload URL." };
    const rawHeaders = record(response.headers ?? upload.headers);
    return {
      uploadUrl,
      fileUrl: typeof response.file_url === "string" ? response.file_url : typeof response.url === "string" ? response.url : undefined,
      key: typeof response.key === "string" ? response.key : typeof response.file_key === "string" ? response.file_key : undefined,
      method: typeof response.method === "string" ? response.method : typeof upload.method === "string" ? upload.method : "PUT",
      headers: Object.fromEntries(Object.entries(rawHeaders).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
    };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Unable to request an upload URL." };
  }
}
