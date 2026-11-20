# CypherVerse Agent Instructions

These instructions apply to all coding agents working in this repository.

## Required workflow
1. Read `.github/skills/cypherverse-development-release/SKILL.md` for all repository work.
2. Read the relevant specialist skill before work in its domain:
   - Architecture/source audit: `.github/skills/cypherverse-architecture-audit/SKILL.md`
   - Prisma/Neon/database: `.github/skills/cypherverse-database-management/SKILL.md`
   - Backend/API: `.github/skills/cypherverse-backend-api/SKILL.md`
   - CyEngine/Builder/3D: `.github/skills/cyengine-builder-development/SKILL.md`
   - Marketplace/CYPH ledger: `.github/skills/cypherverse-marketplace-ledger/SKILL.md`
   - Parcel/world publishing: `.github/skills/cypherverse-parcel-world-publishing/SKILL.md`
   - Security/authentication: `.github/skills/cypherverse-security-audit/SKILL.md`
   - Tests/releases: `.github/skills/cypherverse-testing-release-verification/SKILL.md`
3. Inspect the actual checked-out source and Git state before proposing or editing code.
4. State scope, acceptance criteria, non-goals, and likely files before implementation.
5. Make the smallest appropriate change and preserve unrelated user work.
6. Review the full diff and run relevant tests/builds. Report exact results.

## Non-negotiable safety
- Do not develop directly on `production`.
- Do not force-push, reset shared branches, discard user changes, or clean untracked files without explicit approval.
- Do not commit, push, merge, deploy, restart production services, or mutate production data without explicit owner approval.
- Do not run production migrations, Prisma migrate resolve/reset, seeds, backfills, or destructive SQL without explicit owner approval.
- Never expose or commit secrets.
- Never claim to have accessed a local machine, VPS, database, or browser unless a connected tool actually performed that action.

## Product invariants
- CypherVerse is the primary Project/Builder/Parcel publishing product; CyEngine provides spatial runtime behavior.
- Project.scene remains authoritative.
- One Parcel has one active Project; Project.parcelId is singular and unique.
- Deployment to an occupied Parcel is rejected; do not silently replace/detach.
- Do not invent Deployment/World models or copied Parcel scenes.
- Treat marketplace/CYPH accounting as financial logic; preserve double-entry balance, idempotency, and auditability.

## Reporting
Use VERIFIED / DOCUMENTED / UNKNOWN / PROPOSED labels where useful. Report changed files, checks and their outcomes, risks, Git state, and the next owner decision. If a command must be run by the owner, provide a short exact command and wait for its output.
