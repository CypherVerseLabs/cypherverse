---
name: cypherverse-testing-release-verification
description: Plan and verify CypherVerse unit, integration, build, regression, release-candidate, and production smoke tests.
---
# CypherVerse Testing and Release Verification

## Test strategy
- Inspect package scripts, installed test frameworks, CI workflows, and existing test conventions before adding tools or scripts.
- Select tests by changed behavior and risk; prefer focused tests first, then broader suites.
- Cover positive, negative, authorization, boundary, concurrency, and regression paths as applicable.
- Keep tests deterministic and isolated. Never use production accounts, real payments, or production databases for ordinary automated tests.
- Do not modify lockfiles or add test frameworks without a demonstrated need.

## Release candidate checks
Verify the exact candidate commit and diff against the current production base. Check:
- Frontend build and relevant browser flows.
- Backend build, API tests, and authorization.
- Prisma validation and migration compatibility.
- Marketplace/ledger invariants for financial changes.
- Parcel ownership/deployment rules for publishing changes.
- CyEngine package/runtime compatibility for 3D changes.
- Environment variable names and deployment order without exposing secret values.
- CI results, dependency/security checks, and generated artifacts.

## Evidence discipline
For every command report whether it passed, failed, was skipped, or was not run. Include relevant output and commit SHA. Do not equate a successful build with correct runtime behavior. State manual checks still required.

## Release gate
Do not merge into production or deploy until the owner approves the reviewed candidate. Prepare smoke tests, monitoring checks, and rollback/forward-fix plan. After deployment, verify critical flows and report observed results rather than assumed success.
