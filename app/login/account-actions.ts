"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError, apiRequest, getWorkspace } from "@/lib/api";
import { establishSession } from "./session";

export type AccountState = { error?: string; success?: string };
function message(error: unknown) { return error instanceof ApiError ? error.message : "The request could not be completed."; }

export async function register(_state: AccountState, form: FormData): Promise<AccountState> {
  const schema = z.object({ name:z.string().trim().min(2).max(120), email:z.union([z.email(),z.literal("")]).optional(), phone:z.string().max(32).optional(), password:z.string().min(8).max(128), organization_name:z.string().trim().min(2).max(120) });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success || (!parsed.data.email && !parsed.data.phone)) return { error: "Enter your name, email or phone, password and organization name." };
  if (form.get("password") !== form.get("confirm_password")) return { error: "Your passwords do not match." };
  let response: unknown;
  try { response = await apiRequest("/auth/register", { method:"POST", body:Object.fromEntries(Object.entries(parsed.data).filter(([,value]) => value !== "")) }); }
  catch (error) { return { error:message(error) }; }
  if (!await establishSession(response)) return { error:"The API returned an unexpected registration response." };
  redirect("/dashboard");
}

export async function forgotPassword(_state: AccountState, form: FormData): Promise<AccountState> {
  const identifier = String(form.get("identifier") ?? "").trim();
  if (identifier.length < 3) return { error:"Enter your email or phone number." };
  try { await apiRequest("/auth/password/forgot", { method:"POST", body:{ identifier } }); return { success:"If your account exists, a reset code will be sent." }; }
  catch (error) { return { error:message(error) }; }
}

export async function resetPassword(_state: AccountState, form: FormData): Promise<AccountState> {
  const token = String(form.get("token") ?? "").trim();
  const new_password = String(form.get("new_password") ?? "");
  if (token.length < 20 || new_password.length < 8) return { error:"Enter a valid reset code and a password of at least 8 characters." };
  if (new_password !== form.get("confirm_password")) return { error: "Your passwords do not match." };
  try { await apiRequest("/auth/password/reset", { method:"POST", body:{token,new_password} }); return { success:"Password changed. Sign in with your new password." }; }
  catch (error) { return { error:message(error) }; }
}

export async function changePassword(_state: AccountState, form: FormData): Promise<AccountState> {
  const { token } = await getWorkspace();
  const current_password = String(form.get("current_password") ?? "");
  const new_password = String(form.get("new_password") ?? "");
  if (!current_password || new_password.length < 8) return { error:"Enter your current password and a new password of at least 8 characters." };
  if (new_password !== form.get("confirm_password")) return { error: "Your passwords do not match." };
  try { await apiRequest("/auth/password/change", { method:"POST", token, body:{current_password,new_password} }); return { success:"Password changed. Other sessions were signed out." }; }
  catch (error) { return { error:message(error) }; }
}

export async function revokeSession(sessionId: string, _state: AccountState, _form: FormData): Promise<AccountState> {
  void _state; void _form;
  const parsed = z.uuid().safeParse(sessionId);
  if (!parsed.success) return { error:"Invalid session ID." };
  const { token } = await getWorkspace();
  try { await apiRequest(`/auth/sessions/${sessionId}`, { method:"DELETE", token }); return { success:"Session revoked." }; }
  catch (error) { return { error:message(error) }; }
}
