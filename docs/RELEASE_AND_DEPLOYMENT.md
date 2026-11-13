# Release and deployment guide

This document describes the application represented by this repository. It does not claim that a Production hosting account, database, object store, AI provider, or payment provider has been provisioned.

## Application runtime

CypherVerse is **not configured as a static export**. The root build scripts generate idea metadata and run `next build`; they do not run `next export`. The web start command is `next start`.

A deployment using the current architecture runs two processes:

- **Next.js web application**: run `npm run build:web`, then `npm run start:web`. The Next runtime serves the React application and existing Next API routes.
- **Express API**: run `npm run build:server`, then `npm run start:server`. The Express server defaults to port 5000.

The Next API routes currently present are `/api/ai/scene`, `/api/ai/starter`, and `/api/greet`. They belong to the Next runtime, not Express. Authenticated application APIs (projects, parcels, marketplace, auth, CYPH and related routes) are mounted by `server/index.ts` in Express. The browser's `NEXT_PUBLIC_API_URL` points to Express and is embedded in the frontend at build time; set it to the externally reachable API origin before building the web app.

Do not configure this application as a static-only site or use `next export` unless the API-route/runtime architecture is deliberately redesigned and verified. A successful frontend build alone does not prove that both processes are deployed and networked correctly.

The current frontend/API route audit found these integration details:

- `StarterAI.tsx` calls the Next route `/api/ai/starter`. Its client currently sends `messages` and expects a `response` field, while the Next handler accepts `history` and returns the service's `message` field. This request/response contract is inconsistent and should be corrected before relying on this guide UI in Production.
- `CyVerseBot` calls `/api/ai/agents` using a same-origin relative URL, but that endpoint is mounted by Express and there is no matching Next API route. When web and Express run on separate origins, the hosting layer must explicitly route this path to Express or the client must call the configured API origin.
- `/api/ai/scene` and `/api/greet` are present as Next API routes; no matching frontend caller was identified in the source search performed for this audit.

These route observations are not evidence that a reverse proxy or hosting rewrite is configured. Validate the actual provider routing before release.

## Reproducible install and build

Use Node.js 20 or newer and npm. The repository has separate npm lockfiles for the root web application and Express server. Install each independently:

```sh
npm ci
npm --prefix server ci
npm run prisma:generate
npm run prisma:validate
npm run test:server
npm run build:web
npm run build:server
```

Start the processes separately:

```sh
npm run start:web
npm run start:server
```

The Prisma client is generated into `server/generated/prisma`; generate it before compiling the server. The server TypeScript build emits `server/dist`. These are generated artifacts, not source files, and should not be edited or committed.

For schema changes, review every migration and run `prisma migrate deploy` only against an explicitly selected target database after backup, approval, and release sequencing. CI uses an ephemeral PostgreSQL service for migration validation. Do not run `server/prisma/seed.ts` against Production.

## Environment variables

Set environment variables in the hosting provider's secret/configuration interface. Never commit real values. The root `.env.example` contains names and safe local defaults only.

| Variable | Process / purpose | Required behavior |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Web build; public browser URL for Express | Set before frontend build. Local default only. |
| `NODE_ENV` | Express runtime | Set to `production` in Production. |
| `PORT` | Express runtime | Optional; defaults to 5000. |
| `CORS_ORIGIN` | Express runtime | Comma-separated exact browser origins allowed to call Express. |
| `DATABASE_URL` | Server / Prisma | PostgreSQL connection string; credentials are secret. |
| `JWT_SECRET` | Express authentication | Required secret; use a strong unique Production value. |
| `R2_ENDPOINT` | Express object storage | Required by current R2 module. |
| `R2_ACCESS_KEY_ID` | Express object storage | Required secret credential. |
| `R2_SECRET_ACCESS_KEY` | Express object storage | Required secret credential. |
| `R2_BUCKET_NAME` | Express object storage | Required bucket name. |
| `R2_PUBLIC_URL` | Express object storage | Required public base URL for uploaded assets. |
| `OPENAI_API_KEY` | AI server modules | Required by current AI service module; keep secret. |
| `OPENAI_MODEL` | AI server modules | Optional; defaults to `gpt-4o-mini`. |
| `OLLAMA_URL` | Optional local Ollama integration | Defaults to `http://localhost:11434`. |
| `OLLAMA_MODEL` | Optional local Ollama integration | Optional model name. |
| `ENABLE_TEST_PAYMENT_SIMULATION` | Express marketplace | Default false. Exact string `true` enables only outside Production. Production is denied regardless. |
| `MARKETPLACE_SYSTEM_SELLER_EMAIL` | Marketplace primary inventory seller | Production requires a valid, explicitly configured, non-`.test` email for an already-provisioned User. This setting does not create that User. |

The R2 module validates its configuration at import time, and the AI service module currently requires `OPENAI_API_KEY` at import time. Configure these before starting Express even if a deployment initially does not expose every related feature.

## Payment safety status

The current Prisma payment environment enum contains only `TEST`; the payment service creates TEST-environment payment records and synthetic test transaction/event identifiers. Test payment creation and confirm/fail/cancel endpoints are guarded server-side:

- The flag must equal the exact string `true`.
- `NODE_ENV=production` always disables the middleware, even if the flag is true.
- Disabled routes respond as not found.

There is no verified real-money payment provider integration in this release snapshot. Do not enable real-money checkout, represent simulated payment as a real charge, or infer that a Production deployment is payment-ready. A real provider requires a separately reviewed integration, webhook authentication/signature verification, idempotency and reconciliation tests, legal/compliance review, and deliberate schema/product decisions.

## Primary marketplace seller blocker

Production marketplace primary-inventory fulfillment looks up the seller using `MARKETPLACE_SYSTEM_SELLER_EMAIL`. Production must set this to a real, already-existing User email that is not a `.test` identity. The application does not provision the User. Historical migration `20261030120000_add_marketplace_order_seller` also contains a TEST fallback identity for backfilling legacy rows; changing that historical migration is not part of release hardening. Before Production marketplace operation, an authorized operator must establish the intended system-seller account and confirm migrated order seller references. This guide performs no account or database changes.

## Release checklist

- [ ] Confirm the release branch and reviewed commit.
- [ ] Configure secrets and environment values independently for web and API processes.
- [ ] Set `NEXT_PUBLIC_API_URL` before web build and verify CORS allows the deployed web origin.
- [ ] Verify database connectivity and review pending Prisma migrations against the intended target.
- [ ] Confirm the R2 bucket and public asset URL are configured.
- [ ] Confirm the AI key is configured or deliberately defer AI functionality with a code-level startup strategy.
- [ ] Keep `ENABLE_TEST_PAYMENT_SIMULATION` unset/false in Production.
- [ ] Keep real-money checkout disabled until a verified provider integration is approved and tested.
- [ ] Configure and verify the Production marketplace system seller before enabling primary marketplace sales.
- [ ] Deploy web and Express API as separate compatible runtimes; verify health endpoints and browser-to-API connectivity.
- [ ] Run smoke tests after deployment. CI/build success is not a substitute for Production smoke tests.

## Hosting-provider notes

The source requires a Next.js server runtime because Next API routes exist, and a separate Express API runtime. This repository inspection does not establish the final Production hosting provider or prove that a Vercel project is correctly configured. Validate provider support for both runtimes and their routing/network configuration before choosing deployment topology.
