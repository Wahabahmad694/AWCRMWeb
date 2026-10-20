import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ORG_COOKIE, REFRESH_COOKIE, apiRequest, record, unwrap } from "@/lib/api";

export async function GET(request: NextRequest) {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const destination = new URL("/dashboard", request.url);
  if (!refresh) return NextResponse.redirect(new URL("/login", request.url));
  try {
    const payload = unwrap(await apiRequest("/auth/refresh", { method: "POST", body: { refresh_token: refresh } }));
    const tokens = record(payload.tokens);
    const accessToken = payload.access_token ?? tokens.access_token;
    const refreshToken = payload.refresh_token ?? tokens.refresh_token;
    if (typeof accessToken !== "string" || typeof refreshToken !== "string") throw new Error("Invalid token response");
    const response = NextResponse.redirect(destination);
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    response.cookies.set(ACCESS_COOKIE, accessToken, { ...options, maxAge: 60 * 15 });
    response.cookies.set(REFRESH_COOKIE, refreshToken, { ...options, maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    response.cookies.delete(ORG_COOKIE);
    return response;
  }
}
