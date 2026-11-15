# CypherVerse Express API

This directory contains the Express application runtime. It is deployed separately from the root Next.js web application.

## Responsibilities

The Express API owns authenticated application endpoints and server-authoritative operations, including authentication, Projects, Parcels, marketplace orders, payment/entitlement processing, and Prisma-backed persistence.

The Next.js application remains a separate runtime and also contains Pages API handlers under `src/pages/api`.

## Setup

From the repository root:

```sh
npm --prefix server ci
npm run prisma:generate
npm run prisma:validate
```

Local API development:

```sh
npm --prefix server run server
```

Build:

```sh
npm run build:server
```

Run the compiled API:

```sh
npm run start:server
```

The server defaults to port 5000. Configure its environment through the hosting provider's secret/configuration manager. Required server configuration includes PostgreSQL `DATABASE_URL`, `JWT_SECRET`, all required R2 settings, and `OPENAI_API_KEY` for the current AI service module. Production marketplace fulfillment also requires `MARKETPLACE_SYSTEM_SELLER_EMAIL` to identify an already-provisioned non-`.test` User.

## Database safety

Prisma schema and migrations live under `server/prisma`. Validate and review migrations before applying them to a shared database. Never run `server/prisma/seed.ts` against Production without an explicitly reviewed and approved data plan.

See [Production configuration](../docs/production-configuration.md) and [Release and deployment](../docs/RELEASE_AND_DEPLOYMENT.md).
