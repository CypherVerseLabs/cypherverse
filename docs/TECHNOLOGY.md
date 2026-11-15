# CypherVerse technology architecture

## Runtime layers

CypherVerse uses two application runtimes:

1. **Next.js 12 web runtime** at the repository root. It serves the web application and Pages API routes in `src/pages/api`.
2. **Express API runtime** in `server/`. It serves authenticated application APIs and uses Prisma for PostgreSQL access.

These are separate processes and must be deployed and networked accordingly. The application is not configured as a static export.

## Platform and spatial runtime boundary

- **CypherVerse** owns accounts, authentication, Projects, Templates/Ideas, Builder application state, publishing, Parcel ownership, marketplace workflows, and product routing.
- **CyEngine** owns spatial runtime behavior such as player-relative positioning, interaction, scene runtime composition, and 3D presentation primitives.

Prefer existing CyEngine systems for spatial behavior and existing CypherVerse stores, hooks, routes, and database models for platform behavior.

## Persistence and storage

- PostgreSQL is accessed through Prisma in the Express application.
- `Project.scene` is the authoritative saved scene for a Project.
- Project publishing stores published scene state and associated asset metadata.
- The R2 integration stores published project assets.
- Parcel ownership and Project-to-Parcel attachment are persisted in the database.

## Project and Parcel invariants

- `Project.parcelId` is singular and unique when populated.
- A Parcel may have at most one active Project.
- A Project may be attached to at most one Parcel.
- Deployment attaches the existing Project to the owned Parcel; it does not create a second World record or copy the scene.
- A conflicting deployment is rejected rather than replacing the active Project.

## Marketplace scope

The current marketplace implementation is parcel-focused. It includes server-authoritative listing/order/payment/entitlement workflows. The checked-in payment simulation is TEST-only; this repository snapshot does not establish a production real-money payment provider integration.

A general 3D asset marketplace, asset library purchasing, and World/Component template products are not established as current functionality by this architecture document.

## Build commands

From the repository root:

```sh
npm ci --legacy-peer-deps
npm --prefix server ci
npm run prisma:generate
npm run prisma:validate
npm run test:server
npm run build:web
npm run build:server
```

The root and server each have a committed npm lockfile. Generated Prisma client output and `server/dist` are build artifacts; do not hand-edit them.
