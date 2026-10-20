import Link from "next/link";
import { Suspense } from "react";
import { DetailPage } from "@/components/shared/detail-page";

type RelatedSection = { title: string; path: string; columns: string[] };
type Props = {
  params: Promise<{ id: string }>;
  title: string;
  apiPath: string;
  back: string;
  actions?: string[];
  related?: (id: string) => RelatedSection[];
};

export function ParamDetailPage(props: Props) {
  return <Suspense fallback={<div className="page-wrap" aria-busy="true"><div className="page-heading"><div><div className="eyebrow"><Link href={props.back}>← Back to {props.title.toLowerCase()}</Link></div><h1>{props.title}</h1><p>Loading record details…</p></div></div></div>}><ParamDetailContent {...props} /></Suspense>;
}

async function ParamDetailContent({ params, title, apiPath, back, actions, related }: Props) {
  const { id } = await params;
  const encodedId = encodeURIComponent(id);
  return <DetailPage title={title} path={`${apiPath}/${encodedId}`} back={back} actions={actions} related={related?.(encodedId)} />;
}
