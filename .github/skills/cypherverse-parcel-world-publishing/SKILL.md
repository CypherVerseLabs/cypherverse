---
name: cypherverse-parcel-world-publishing
description: Develop and audit CypherVerse Parcels, ownership, parcel infrastructure, Project publishing/deployment, and persistent world updates.
---
# CypherVerse Parcel and World Publishing

## Product model
- User creates a Project from a template, edits and saves it in Builder, acquires a Parcel, then publishes/deploys the Project onto that Parcel.
- Project.scene remains the authoritative scene; do not copy scene data onto Parcel.
- One Parcel has one active Project/World.
- Project.parcelId is singular and unique; one Project may attach to at most one Parcel.
- Deploying another Project to an occupied Parcel must return a conflict (HTTP 409); preserve the existing attachment.
- Same Project/same Parcel may be idempotent if existing API contract specifies it.
- No Deployment model, World model, replacement/detachment flow, or duplicated scene storage without explicit owner approval.

## Audit
Inspect Prisma schema, Project and Parcel stores, ownership checks, deployment API, UI hooks, map/grid/chunk coordinate systems, parcel reservation/listing flows, and tests. Verify actual database parcel records before data operations. Distinguish reserved infrastructure parcels from ordinary purchasable parcels.

## Implementation
- Enforce ownership and attachment rules server-side and transactionally.
- Handle uniqueness/concurrency races and stable conflict responses.
- Keep coordinate mapping and map rendering consistent with authoritative parcel data.
- Do not run production parcel seed scripts or overwrite production parcel records.
- Do not invent parcel resale/transfer behavior when a parcel has an attached Project; surface the undefined product rule for owner decision.

## Verification
Test ownership, free/occupied parcels, same-project idempotency, already-attached projects, concurrent deployment attempts, coordinate boundaries, reserved parcels, and map/Builder integration. Review migration and data effects separately. No production deploy or data mutation without approval.
