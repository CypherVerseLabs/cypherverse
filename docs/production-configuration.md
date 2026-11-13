# CypherVerse deployment and production configuration

## Deployment model

The current application contains two server-side applications:

- **Web application:** Next.js 12. The repository has three Pages Router API handlers:
  - `src/pages/api/ai/scene.ts`
  - `src/pages/api/ai/starter.ts`
  - `src/pages/api/greet.ts`
- **Application API:** the Express application in `server/index.ts`, which mounts authentication, projects, parcels, marketplace, CYPH, and AI routers.

The frontend reads `NEXT_PUBLIC_API_URL` in `src/ideas/context/AuthContext.tsx`. Its authenticated fetch helper prefixes relative API paths with this URL. Set it to the externally reachable Express API origin, including scheme and port if applicable. It is a public build-time value, not a secret.

**Use the Next.js server runtime, not static export, for this release.** Next Pages API routes are not supported by Next.js static export. The previous `next build && next export` command therefore conflicts with the checked-in API handlers, while `next start` expects a normal `.next` server build. The root `build` command now runs `next build` without `next export`; `start:web`/ `start` run `next start`.

Run the Next.js web process and Express API as separate services. Route the browser's configured `NEXT_PUBLIC_API_URL` to Express; route the web origin to the Next.js process. Do not assume Vercel or any other hosting provider is the final host. The three Next API handlers remain part of the Next runtime. Before a future static-hosting migration, trace each frontend caller and move/replace any required Pages API handlers deliberately; do not reintroduce `next export` while those handlers remain.

The repository contains both Next API handlers and Express AI routes. The Next API handlers import the shared server AI services directly. A full frontend call-site inventory could not be established during this hardening pass, so neither implementation was removed.

## Environment variables

Never commit real values. Supply secrets through the chosen hosting provider's secret manager. The root `.env.example` contains blank placeholders only.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Server-side JWT signing/verification secret |
| `NODE_ENV` | Runtime mode; set to `production` for Production |
| `PORT` | Express listen port (defaults to 5000) |
| `CORS_ORIGIN` | Comma-separated allowed browser origins for Express |
| `NEXT_PUBLIC_API_URL` | Public Express API origin embedded into the Next.js browser bundle at build time |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` | R2 access key identifier |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket used for uploads |
| `R2_PUBLIC_URL` | Public base URL for stored objects |
| `OPENAI_API_KEY` | OpenAI API credential used by AI services |
| `OPENAI_MODEL` | OpenAI model name (defaults to `gpt-4o-mini`) |
| `OLLAMA_URL` | Optional Ollama endpoint (defaults to local port 11434) |
| `OLLAMA_MODEL` | Optional local Ollama model name |
| `ENABLE_TEST_PAYMENT_SIMULATION` | Explicit opt-in for simulated payment routes; must be `false`/unset in Production |
| `MARKETPLACE_SYSTEM_SELLER_EMAIL` | Email of the existing User row used as the system seller in Production |

The current Express startup imports R2 and AI service modules, which validate their required configuration during module initialization. Configure R2 and OpenAI values before starting the API. The AI credential must also be available to the Next.js server runtime for the retained Next API handlers.

## Marketplace payment safety

There is no verified real-money payment provider implementation in this release baseline. The order payment-creation endpoint currently creates a synthetic TEST payment record; it is not a checkout integration. The payment-record creation route and all confirm/fail/cancel simulation routes are gated by the same middleware.

The server gate requires both:
- `NODE_ENV` is not `production`; and
- `ENABLE_TEST_PAYMENT_SIMULATION=true`.

In Production, the gate returns 404 even if the flag is mistakenly set to `true`. Keep the flag unset or `false`. Do not enable real-money checkout, represent a pending TEST payment as a real payment, or configure a real payment provider until provider creation, signed webhook/event verification, idempotency, settlement, and reconciliation have been implemented and independently tested. CYPH ledger payment is a separate internal-currency path and is not a card/payment-provider integration.

## Production system seller

The service no longer silently looks up the TEST email in Production. Set `MARKETPLACE_SYSTEM_SELLER_EMAIL` to the email of a deliberately provisioned existing system-seller User. The application validates that Production does not use a `.test` email and fails the settlement lookup with an explicit configuration error if the value is missing. This is evaluated when settlement is attempted, not during API startup. Non-production environments retain the current TEST fallback.

This change does not create users, alter ownership, or require a database migration. Production provisioning must ensure the configured email belongs to the intended User before marketplace settlement is enabled. If no approved Production system-seller User exists, treat marketplace seller settlement as a release blocker; do not copy the TEST seller account or seed data.

## Install, generate, build, and start

From the repository root:

```sh
npm ci
npm run build:web
npm run start:web
```

For the Express API, from the repository root:

```sh
npm install --prefix server
npm --prefix server run prisma:generate
npm --prefix server run build:dist
npm --prefix server start
```

For local development, install the root and server dependencies separately. The backend currently has no committed `server/package-lock.json`; therefore `npm install --prefix server` is not yet a fully reproducible/frozen install. Do not claim backend dependency reproducibility until a reviewed server lockfile is generated and committed. Root frontend installs are reproducible through the committed `package-lock.json` and `npm ci`.

Prisma client generation writes to `server/generated/prisma`. It is generated build output and must be regenerated from `server/prisma/schema.prisma` after installing server dependencies; do not hand-edit it. The server TypeScript build writes `server/dist` from source using `server/tsconfig.build.json`. Treat `server/dist` as generated output and do not edit it manually. The current build configuration compiles the server entry point, routes, middleware, services, stores, libraries, and types.

Prisma validation and client generation do not connect to or modify a database. Do not run migrations against a shared database as part of this release-hardening PR. Fresh-database migration rehearsal is a separate release gate requiring an isolated disposable PostgreSQL instance. Never run `server/prisma/seed.ts` against Production.

## CI and deployment checks

The release-hardening workflow runs the frontend build, backend TypeScript build, Prisma client generation/validation, unit tests for payment gates and migration-directory structure, and does not connect to a database or apply migrations.

A prior Vercel deployment for the TEST baseline was reported failed. Its deployment log command referenced deployment `dpl_Fn6S3XkRusjJoZKjVQKs3Hg8fohG`; provider logs were not accessible during this pass. This is not evidence that Vercel is the selected Production host. Choose and document the actual hosting provider before provisioning Production.
