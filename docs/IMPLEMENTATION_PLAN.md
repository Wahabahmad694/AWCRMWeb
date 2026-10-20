# A.W CRM implementation plan and status

## Architecture

The source contract is the live OpenAPI document at `https://aw-crm-mu.vercel.app/api/docs/openapi.json` (base `/api/v1`). Next.js 16 App Router Server Components perform initial reads. Server Actions handle forms; a route handler streams authenticated CSV exports. The browser never receives API bearer or refresh tokens. Cookies are HTTP-only and secure in production. Organization choice is validated against the current user's memberships. API permission checks remain authoritative.

## Completed implementation

1. Authentication, session renewal and account recovery.
2. API-backed dashboard and read views across the listed modules.
3. Mutations from the requested endpoint map through a fixed operation catalog, with version checks, idempotency keys, server validation and error messages.
4. Responsive shell, loading, empty and permission/error states.
5. README and API/screen documentation.

## Release gates

1. **Authenticated contract QA:** Exercise each operation against a disposable organization and inspect actual success payloads. Swagger documents most request bodies and errors but leaves most successful responses without schemas. Adjust mappings and verify role restrictions, lifecycle transitions and pagination metadata.
2. **UX refinement:** Replace remaining manual UUID entry in complex forms with searchable selectors, and show detailed order lines, receipts and customer ledger rows once success schemas are verified.
3. **Printing and AI:** Build these when the backend exposes a print/PDF contract and AI chat contract. Do not fabricate financial documents or assistant answers.
4. **Deployment QA:** Check environment URL, HTTPS cookies, organization switching, mobile and keyboard behavior and rate-limit/expired-session flows.

For every phase run `npm run typecheck`, `npm run lint`, `npm run build`, then manually inspect affected routes. No test files are added, per request.
