/** Keep session returns on local application routes, never external or auth-loop URLs. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://workspace.invalid");
    if (url.origin !== "https://workspace.invalid" || /^\/(session|login|register|reset-password|forgot-password)(\/|$)/.test(url.pathname)) return "/dashboard";
    return `${url.pathname}${url.search}`;
  } catch { return "/dashboard"; }
}

/** API resources and browser routes do not always share the same name. */
export function resourceReturnPath(path: string): string {
  const routes: Record<string, string> = {
    "/customers": "/customers",
    "/targets": "/sales-targets",
    "/reminders": "/activities/reminders",
    "/product-categories": "/products/categories",
    "/expense-categories": "/expenses/categories",
    "/refunds": "/payments/refunds",
    "/receivables": "/payments/receivables",
  };
  if (routes[path]) return routes[path];
  if (path.startsWith("/targets/")) return path.replace("/targets/", "/sales-targets/");
  return safeReturnPath(path);
}
