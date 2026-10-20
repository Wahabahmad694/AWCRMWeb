# A.W CRM screen map

- `/login`, `/register`, `/forgot-password`, `/reset-password` — account entry and recovery.
- `/dashboard` — summary, trend, order, follow-up and stock snapshot.
- `/customers`, `/customers/[id]` — customer list, detail and operations.
- `/orders`, `/orders/[id]` — order list, detail and workflow.
- `/products`, `/products/[id]`, `/products/categories` — catalog and categories.
- `/inventory`, `/inventory/[id]`, `/inventory/low-stock`, `/inventory/movements` — stock views and adjustments.
- `/payments`, `/payments/[id]`, `/payments/receivables`, `/payments/refunds` — money received and balances.
- `/sales-targets`, `/sales-targets/[id]` — target list and progress.
- `/expenses`, `/expenses/[id]`, `/expenses/categories` — spending and categories.
- `/reports`, `/exports/[kind]` — analytics and authenticated CSV downloads.
- `/activities`, `/activities/[id]`, `/activities/reminders` — interactions and follow-ups.
- `/team`, `/settings`, `/notifications` — membership, organization and inbox.
- `/ai-assistant` — explicit unavailable state while the API has no chat endpoint.

The default route `/` redirects to `/dashboard`. Protected pages redirect unauthenticated visitors to `/login`.
