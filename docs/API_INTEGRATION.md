# API integration

Contract: [A.W CRM Swagger](https://aw-crm-mu.vercel.app/api/docs) and [OpenAPI JSON](https://aw-crm-mu.vercel.app/api/docs/openapi.json). API base: `/api/v1`.

## Covered in the web UI

| Area | Reads and actions |
| --- | --- |
| Account | Register, sign in, refresh, sign out, sign out everywhere, password reset/change, current user, sessions and revoke session |
| Dashboard | Summary, trends, recent orders, activities, reminders and low stock |
| Customers | List/detail, create/update/archive/restore/delete, orders, payments, ledger, activities and notes |
| Products | List/detail, create/update/archive/restore/delete, product categories and category mutations |
| Inventory | Stock list/detail, low stock, valuation, movements, adjustment and stocktake |
| Orders | List/detail, create/update, confirm/process/fulfill/cancel/return, payments and timeline |
| Payments | List/detail/summary, record/reverse, receivables and refunds |
| Targets | List/detail/progress, create/update/archive |
| Expenses | List/detail/summary, create/update/void and categories |
| Reports | Sales summary, trends, by customer, by product, inactive customers, collections, expenses, valuation and four CSV exports |
| Activities | List/detail, create/update/complete, customer activity, reminders |
| Team | Organization membership, invitation, update/remove member and accept invitation |
| Settings | Organization list/detail/create/update, subscription, notification preferences |
| Notifications | List, unread count, mark one/all read |

Mutations use a server-owned operation catalog in `lib/operations.ts`. The browser cannot supply an arbitrary API route. Server Actions validate form data, use `expected_version` where required, and send `Idempotency-Key` for the operations that require it. The API remains the authorization authority. Tenant and financial requests are never cached.

## Contract limitations

Most successful responses have no schema in the OpenAPI document. The UI uses defensive parsing and shows empty/error states, but field mapping and every mutation response require an authenticated API QA pass. Some complex line items require IDs from existing records. No AI chat or dedicated PDF print endpoint is documented. The API's file upload endpoint is outside the requested UI mapping and is not wired to a file control.
