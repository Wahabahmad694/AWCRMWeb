"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError, apiRequest, getWorkspace, record } from "@/lib/api";

export type InviteState = { error?: string; success?: string; token?: string };
const roles = ["owner", "admin", "manager", "sales", "accountant", "viewer"];

export async function inviteMember(_previous: InviteState, form: FormData): Promise<InviteState> {
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const role = String(form.get("role") ?? "").trim();
  if (!email && !phone) return { error: "Enter an email address or phone number." };
  if (email && !z.email().safeParse(email).success) return { error: "Enter a valid email address." };
  if (phone && phone.length > 30) return { error: "The phone number is too long." };
  if (!roles.includes(role)) return { error: "Choose a valid role." };

  const workspace = await getWorkspace("/team");
  if (!workspace.organizationId) return { error: "Select an organization first." };
  try {
    const response = await apiRequest(`/organizations/${encodeURIComponent(workspace.organizationId)}/invitations`, {
      method: "POST",
      token: workspace.token,
      organizationId: workspace.organizationId,
      body: { ...(email ? { email } : {}), ...(phone ? { phone } : {}), role },
    });
    const outer = record(response);
    const data = record(outer.data ?? outer);
    const invitation = record(data.invitation);
    const token = [data.token, data.invitation_token, invitation.token, outer.token].find(value => typeof value === "string" && value.length > 0);
    revalidatePath("/team");
    return { success: token ? "Invitation created. Copy the token and share it with the invited person." : "Invitation created. The API did not return a token to display.", token: typeof token === "string" ? token : undefined };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Unable to create the invitation." };
  }
}
