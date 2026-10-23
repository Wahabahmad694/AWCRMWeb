import Link from "next/link";
import { ModuleHeader } from "@/components/modules/module-ui";
import { FileUpload } from "@/components/modules/file-upload";

export default function Page() {
  return <div className="module-page"><ModuleHeader eyebrow="SETTINGS / STORAGE" title="Files" description="Upload product images, receipts, and workspace documents." /><nav className="module-actions"><Link className="module-secondary" href="/settings">Back to settings</Link></nav><FileUpload /></div>;
}
