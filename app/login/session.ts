import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, ORG_COOKIE, REFRESH_COOKIE, items, record, unwrap } from "@/lib/api";

export async function establishSession(payload: unknown) {
  const data = unwrap(payload);
  const tokens = record(data.tokens);
  const access = data.access_token ?? tokens.access_token;
  const refresh = data.refresh_token ?? tokens.refresh_token;
  if (typeof access !== "string" || typeof refresh !== "string") return false;
  const jar = await cookies();
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  jar.set(ACCESS_COOKIE, access, { ...options, maxAge: 60 * 15 });
  jar.set(REFRESH_COOKIE, refresh, { ...options, maxAge: 60 * 60 * 24 * 30 });
  const memberships = items(data.memberships ?? data.organizations);
  const first = memberships[0];
  const org = record(first?.organization);
  const id = first?.organization_id ?? org.id ?? first?.id;
  if (typeof id === "string") jar.set(ORG_COOKIE, id, { ...options, maxAge: 60 * 60 * 24 * 30 });
  return true;
}
