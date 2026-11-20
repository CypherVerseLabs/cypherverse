---
name: cypherverse-architecture-audit
description: Audit CypherVerse and CyEngine source architecture before changing code; trace real implementations and identify the smallest safe integration point.
---
# CypherVerse Architecture and Code Audit

## Mandatory approach
- Inspect the checked-out repository, branch, working tree, and actual source before making claims or edits.
- Treat GitHub, local development, test, and production checkouts as potentially different. Record commit SHAs and compare relevant refs.
- Trace behavior end-to-end: UI → component/hook/context/store → API client → route/controller/service/store → Prisma/database, as applicable.
- Inspect callers, callees, types, tests, routing conventions, package scripts, and configuration around the target.
- Search for existing implementations before proposing new components, models, endpoints, hooks, or abstractions.
- Prefer the smallest change that fits established architecture. Preserve unrelated work and user changes.
- Never infer unseen source from filenames, comments, old notes, or partial snippets.

## Audit report
Classify every material finding:
- **VERIFIED**: directly confirmed in current source or command output.
- **DOCUMENTED**: described in repository documentation but not independently verified.
- **UNKNOWN**: evidence is missing or contradictory.
- **PROPOSED**: a recommendation, not current behavior.

Report the exact files and symbols inspected, the actual data/control flow, existing reusable systems, risks, and the minimum proposed change. Separate facts from recommendations.

## Product architecture constraints
- CypherVerse is the primary Project/Builder/Parcel publishing product; CyEngine supports spatial runtime behavior.
- A Project's scene remains authoritative unless the owner approves an architecture change.
- One Parcel has one active Project; Project.parcelId is singular and unique.
- Deployment to an occupied Parcel must conflict; never silently replace or detach.
- Do not invent Deployment/World models, duplicate scene storage, or alternate publishing systems.
- Marketplace and CYPH ledger behavior is financially sensitive; do not alter business rules during unrelated work.

## Change gate
Before editing, state scope, non-goals, files likely involved, and acceptance criteria. If implementation reveals a wider required change, stop and explain rather than silently expanding scope. After editing, inspect the complete diff and run relevant checks. Never claim verification without evidence.
