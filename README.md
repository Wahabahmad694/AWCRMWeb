# A.W CRM web

A Next.js 16 App Router frontend for the [A.W CRM API](https://aw-crm-mu.vercel.app/api/docs). It covers sales, customers, orders, products, stock, payments, targets, expenses, reports, activities, team and settings.

## Local setup

Requirements: Node.js compatible with Next.js 16, npm, and an A.W CRM API account.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. `NESTJS_API_BASE_URL` must be the full versioned API base. The example uses `https://aw-crm-mu.vercel.app/api/v1`; point it at your local NestJS instance if needed. Never place user credentials or access tokens in `.env.local`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Structure

- `app/` — App Router pages, Server Actions and authenticated CSV route handler.
- `lib/api.ts` — server-only API client, session/organization context, errors and response helpers.
- `lib/operations.ts` — fixed form-to-endpoint catalog. Browser input cannot choose arbitrary paths.
- `components/shared/` — record lists, details, validated operation forms and line-item editor.
- `components/shell/` — responsive workspace navigation.
- `docs/` — [implementation plan](docs/IMPLEMENTATION_PLAN.md), [API coverage](docs/API_INTEGRATION.md), [screen map](docs/SCREEN_MAP.md) and design system.

Server Components fetch organization data with `cache: 'no-store'`. Server Actions submit mutations with an API bearer token and `X-Organization-Id` only on the server. Access and rotating refresh tokens live in HTTP-only cookies. Versioned changes include `expected_version`; idempotent operations include `Idempotency-Key`. Money entered as PKR is converted to integer paisa before submission. The backend enforces permissions.

## Current limits

Swagger defines most request bodies and errors, but omits schemas for most successful responses. An authenticated QA pass is required to confirm every field mapping and end-to-end action. Some forms still use record UUIDs. The API has no documented AI chat or invoice/receipt PDF endpoint. See the [release gates](docs/IMPLEMENTATION_PLAN.md#release-gates).

### Authentication UI

Login, registration, password recovery, and password reset share `components/auth/auth-shell.tsx` and `auth.module.css`. Password visibility and password confirmation are supported; confirmation is checked in both the form and the account Server Actions. Registration accepts an email address or a phone number. The change-password form in Settings uses the same input components.

CSS uses the official `@tailwindcss/postcss` plugin through `postcss.config.mjs`, with native Next.js CSS Modules. Both Turbopack development and webpack production builds use this configuration. Restart `npm run dev` after changing CSS tooling or installing dependencies.

Manual QA covers the four auth routes, navigation, required inputs, and password visibility. Successful authentication, registration, and password recovery still require a real API account or reset code to validate end to end. No test files are added.
