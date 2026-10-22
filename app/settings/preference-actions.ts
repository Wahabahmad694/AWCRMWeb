"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiRequest, getWorkspace } from "@/lib/api";

export type PreferenceState = { error?: string; success?: string };
const notificationTypes = ["order_confirmed","payment_recorded","low_stock","follow_up_due","member_joined"] as const;
export async function savePreferences(_state: PreferenceState, form: FormData): Promise<PreferenceState> {
  const workspace = await getWorkspace("/settings");
  if (!workspace.organizationId) return { error:"Select an organization first." };
  const preferences = notificationTypes.map(type => ({ type, in_app:form.get(type) === "on" }));
  try { await apiRequest("/notification-preferences", { method:"PUT", token:workspace.token, organizationId:workspace.organizationId, body:{ preferences } }); }
  catch (error) { return { error:error instanceof ApiError ? error.message : "Could not update preferences." }; }
  revalidatePath("/settings");
  revalidatePath("/settings/manage");
  return { success:"Notification preferences saved." };
}
