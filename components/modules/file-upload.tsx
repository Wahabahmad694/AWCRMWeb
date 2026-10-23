"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { requestUpload } from "@/app/actions/files";

export function FileUpload() {
  const input = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState("document");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ name: string; url?: string; key?: string }>();
  const [pending, startTransition] = useTransition();

  function upload() {
    const file = input.current?.files?.[0];
    setError(""); setResult(undefined);
    if (!file || file.size < 1 || file.size > 20 * 1024 * 1024) { setError("Choose a file no larger than 20 MB."); return; }
    startTransition(async () => {
      const ticket = await requestUpload({ purpose, filename: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size });
      if (ticket.error || !ticket.uploadUrl) { setError(ticket.error ?? "Unable to prepare the upload."); return; }
      try {
        const headers = new Headers(ticket.headers);
        if (!headers.has("Content-Type")) headers.set("Content-Type", file.type || "application/octet-stream");
        const response = await fetch(ticket.uploadUrl, { method: ticket.method ?? "PUT", headers, body: file });
        if (!response.ok) throw new Error(`Upload failed (${response.status}).`);
        setResult({ name: file.name, url: ticket.fileUrl, key: ticket.key });
        if (input.current) input.current.value = "";
      } catch (cause) { setError(cause instanceof Error ? cause.message : "The file upload failed."); }
    });
  }

  return <div className="module-card"><div className="module-card-header"><span><FileUp size={20} /></span><div><h2>Upload a file</h2><p className="module-muted">Files go directly to configured storage using a short-lived signed URL.</p></div></div><div className="operation-form">
    <label><span>Purpose *</span><select value={purpose} onChange={event => setPurpose(event.target.value)} disabled={pending}><option value="document">Document</option><option value="receipt">Receipt</option><option value="product_image">Product image</option></select></label>
    <label><span>File *</span><input ref={input} type="file" disabled={pending} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {result && <p className="form-success" role="status"><CheckCircle2 size={15} /> {result.name} uploaded successfully.{result.key ? ` Storage key: ${result.key}` : ""}{result.url ? <> <a href={result.url} target="_blank" rel="noreferrer">Open file</a></> : null}</p>}
    <button type="button" onClick={upload} disabled={pending}><UploadCloud size={16} /> {pending ? "Uploading…" : "Upload file"}</button>
  </div></div>;
}
