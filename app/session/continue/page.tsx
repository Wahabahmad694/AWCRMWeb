"use client";

import { useEffect } from "react";

export default function ContinueSessionPage() {
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    window.location.replace(`/session/renew?next=${encodeURIComponent(next)}`);
  }, []);

  return <main className="session-continue" role="status" aria-live="polite"><span className="session-continue-spinner" aria-hidden="true" /><h1>Checking your session</h1><p>You’ll be taken to your workspace or the sign-in page shortly.</p></main>;
}
