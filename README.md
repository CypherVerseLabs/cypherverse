# CypherVerse

CypherVerse is a platform for creating, managing, publishing, and experiencing interactive 3D websites and worlds. It combines creator accounts, persistent Projects, templates, a 3D Builder, publishing, Parcel ownership, and public experiences.

CypherVerse is the platform and product layer. [CyEngine](https://github.com/CypherVerseLabs/cyengine) is the spatial runtime used to render and operate interactive 3D experiences.

## Product model

The primary creator workflow is:

```text
Choose Template
      ↓
Create Project
      ↓
Edit Project in Builder
      ↓
Save Project to Account
      ↓
Browse / Own Parcel
      ↓
Deploy Project to Owned Parcel
      ↓
Persistent World on Parcel
      ↓
Edit the same Project and publish updates
```

A Project is the authoritative source of its scene data. Publishing a Project and deploying it to a Parcel are separate operations.

**Parcel relationship rules:**

- One Parcel has at most one active Project.
- A Project can be attached to at most one Parcel.
- The relationship is represented by the singular `Project.parcelId` association.
- Deploying a different Project to an occupied Parcel is rejected; it does not replace or detach the existing Project.
- There is no separate Deployment model or copied World scene in this architecture.

## Main responsibilities

| Area | Responsibility |
| --- | --- |
| Accounts and authentication | User identity, sessions, and server-side ownership checks |
| Projects | Persistent creator-owned project metadata and authoritative scene |
| Templates / Ideas | Starting points used to create Projects |
| Builder / Editor | Editing a Project's scene |
| Publishing | Publishing a Project's scene and associated assets for public access |
| Parcels | Virtual land ownership and parcel lifecycle |
| Deployment | Attaching one owned Project to one owned Parcel under the one-project-per-parcel rule |
| Marketplace | Parcel listings, orders, payment records, and entitlement/ownership processing |
| CyEngine | Spatial behavior and 3D runtime |

CypherVerse is not currently documented as a general 3D asset marketplace. Do not treat proposed WorldTemplate, ComponentTemplate, or asset-library marketplace concepts in older notes as implemented product functionality.

## Runtime architecture

The repository contains two server-side runtimes:

- **Next.js web application** at the repository root. It serves the frontend and the Pages API routes under `src/pages/api`.
- **Express application** under `server/`. It serves authenticated application APIs, including authentication, Projects, Parcels, marketplace, and related services.

The browser's `NEXT_PUBLIC_API_URL` points to the externally reachable Express API origin. It is a public build-time setting, not a secret. Next.js API routes remain part of the web runtime; this is not a static-export application.

The Express server uses Prisma and PostgreSQL. Project asset publishing uses the configured Cloudflare R2-compatible object storage integration.

## Development

Requirements: Node.js 20+ and npm.

Install both dependency sets from the repository root:

```sh
npm ci --legacy-peer-deps
npm --prefix server ci
npm run prisma:generate
npm run prisma:validate
```

Run the web application:

```sh
npm run dev
```

Run the Express API in a second terminal:

```sh
npm --prefix server run server
```

Build:

```sh
npm run build:web
npm run build:server
```

Run server tests:

```sh
npm run test:server
```

See [Development](docs/DEVELOPMENT.md), [API reference](docs/CYPHERVERSE-API.md), [Parcel and marketplace architecture](docs/Parcels%20%26%20Marketplace.md), and [Release and deployment](docs/RELEASE_AND_DEPLOYMENT.md).

## Production safety

- Never run `server/prisma/seed.ts` against Production.
- Review pending migrations against the intended database before applying any migration.
- Keep test-payment simulation disabled in Production. The current payment flow is not a verified real-money payment-provider integration.
- Production marketplace primary inventory requires an explicitly provisioned, non-`.test` system-seller User configured through `MARKETPLACE_SYSTEM_SELLER_EMAIL`.
- Do not claim Production readiness from a successful frontend build alone; verify both runtimes, their network routing, database compatibility, object storage, and smoke tests.

## Related projects

- [CyEngine](https://github.com/CypherVerseLabs/cyengine) — 3D runtime.
- [CypherVerse](https://cypherverse.space) — product.
- [CypherVerseLabs](https://github.com/CypherVerseLabs) — GitHub organization.
