"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACCESS_COOKIE, ApiError, ORG_COOKIE, REFRESH_COOKIE, apiRequest, items } from "@/lib/api";
import { establishSession } from "./session";

export type LoginState = { error?: string };
const schema = z.object({ identifier: z.string().min(3), password: z.string().min(1) });

export async function login(_state: LoginState, form: FormData): Promise<LoginState> {
  const result = schema.safeParse({ identifier: form.get("identifier"), password: form.get("password") });
  if (!result.success) return { error: "Enter your email or phone and password." };
  let payload: unknown;
  try { payload = await apiRequest("/auth/login", { method: "POST", body: result.data }); }
  catch (error) { return { error: error instanceof ApiError ? error.message : "Sign in failed." }; }
  if (!await establishSession(payload)) return { error: "The API returned an unexpected login response." };
  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token) await apiRequest("/auth/logout", { method: "POST", token }).catch(() => undefined);
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(ORG_COOKIE);
  redirect("/login");
}

export async function selectOrganization(form: FormData) {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");
  const id = String(form.get("organization_id") ?? "");
  const available = items(await apiRequest("/organizations", { token }));
  if (!available.some((organization) => organization.id === id)) return;
  jar.set(ORG_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/dashboard");
}

export async function logoutEverywhere() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token) await apiRequest("/auth/logout-all", { method:"POST", token });
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(ORG_COOKIE);
  redirect("/login");
}
