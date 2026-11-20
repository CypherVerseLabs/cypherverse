---
name: cypherverse-development-release
description: Safely plan, inspect, implement, test, review, and release changes in the CypherVerse and CyEngine repositories. Use for feature work, bug fixes, audits, Git branch operations, database changes, pull requests, and production releases.
---

# CypherVerse Development and Release Management

## Purpose

Use this skill to make CypherVerse changes in a controlled, reviewable way. Protect production, preserve existing architecture and user work, and require explicit approval for consequential Git, database, and deployment actions.

## Repository principles

- CypherVerse is the primary product. CyEngine supports its spatial runtime and builder.
- Inspect the actual current source before proposing or making code changes.
- Integrate with existing architecture. Reuse existing types, stores, hooks, routes, services, components, and database models.
- Make the smallest appropriate change. Do not redesign unrelated systems or introduce duplicate abstractions.
- Preserve unrelated changes, untracked files, local configuration, and user work.
- Treat GitHub branches and local folders as potentially different. Fetch and compare before assuming they are synchronized.
- Distinguish findings as **VERIFIED**, **DOCUMENTED**, **UNKNOWN**, or **PROPOSED**. Never present an assumption as a verified fact.
- Do not expose secrets, credentials, tokens, private keys, or sensitive production data in output or commits.

## Branch and environment model

Use these roles unless the repository owner explicitly changes the policy:

- `main`: primary development integration branch.
- Feature/fix branches: isolated work for one coherent task, branched from the current `main`.
- `test`: integration/testing branch. Promote reviewed changes into it and verify the integrated result. Do not assume it is automatically identical to `main`.
- `production`: release branch. Only approved, tested release commits belong here.
- Local production checkout: deployment/release workspace, not a general development workspace.

Before any branch operation:

1. Confirm repository root, remote URL, current branch, working-tree status, and upstream.
2. Fetch the relevant remote refs.
3. Compare local and remote commits (ahead/behind) and inspect the merge base when histories diverge.
4. Inspect modified, staged, and untracked files.
5. Preserve local work. Never use destructive cleanup to make a checkout appear clean.

Never assume a branch name or tracking ref exists. Verify it.

## Standard change workflow

### 1. Define scope

Write down:
- Requested behavior and acceptance criteria.
- Files/systems likely involved.
- Explicit non-goals and behavior that must not change.
- Data, API, security, compatibility, and deployment risks.

Ask one focused clarification only when an essential requirement is missing.

### 2. Audit before editing

Trace the existing implementation end-to-end where applicable:
- UI/component → hook/context/store → API client → backend route/controller/service/store.
- Types and validation at each boundary.
- Prisma schema and migrations for data-backed changes.
- Existing tests, routing conventions, configuration, and deployment scripts.

Use repository source as the authority. Search related implementations and tests before creating new ones.

### 3. Isolate the work

- Create a descriptive feature/fix branch from the verified current `main`.
- Keep one logical task per branch and pull request.
- Do not develop directly on `main`, `test`, or `production`.
- Do not switch branches in a dirty working tree unless all changes are safely preserved and the operation is intentional.
- Prefer a separate worktree or clean development checkout when another checkout contains local or production work.

### 4. Implement minimally

- Follow existing naming, formatting, error handling, and architectural patterns.
- Keep API contracts and frontend types aligned.
- Add or update focused tests for changed behavior.
- Avoid unrelated formatting, dependency upgrades, lockfile churn, generated files, and broad refactors.
- Do not silently change product rules or marketplace/financial behavior.

### 5. Verify

Run the narrowest useful checks first, then broader checks as appropriate:
- Focused unit/integration tests.
- TypeScript checks and linting.
- Frontend build.
- Backend build and tests.
- Prisma schema validation and migration checks for database work.
- Relevant end-to-end/manual behavior checks in the test environment.

Report exact commands and results. Separate passed, failed, skipped, and not-run checks. Never claim a check passed unless its output confirms it.

### 6. Review the diff

Before committing or opening a PR:
- Inspect `git diff`, `git diff --cached`, and `git status`.
- Confirm only intended files changed.
- Review deletions, generated files, dependency and lockfile changes, migrations, environment files, and secrets.
- Check that tests cover important success, failure, authorization, and edge cases.
- Summarize risks and remaining unknowns.

### 7. Promote through environments

Recommended promotion path:

1. Feature/fix branch → pull request into `main`.
2. Review and merge into `main`.
3. Promote the intended commit(s) into `test`; run integration and acceptance checks.
4. Prepare a release candidate and review the exact diff from current `production`.
5. Open a pull request into `production`.
6. Obtain explicit owner approval before merging.
7. Deploy the approved production commit using the established deployment process.
8. Verify health, logs, critical user flows, and database state; retain a rollback plan.

Do not merge all of `main` into `production` merely because `main` is newer. Review the exact changes and production-specific history first. If branches have diverged, reconcile in an isolated branch/worktree and preserve both sides' valid work.

## Approval gates

The owner must explicitly approve each consequential action before it is performed:

- Creating commits or pushing commits/branches.
- Merging pull requests or changing branch history.
- Applying, resolving, resetting, or deploying database migrations.
- Running production seeds or data backfills.
- Changing production environment variables or secrets.
- Restarting services, deploying, rolling back, or changing production infrastructure.
- Deleting branches, files, data, or backups.

Read-only inspection and local non-destructive checks may be performed without release approval. Do not interpret approval for one action as approval for later actions.

Never force-push shared branches or reset a production branch to another branch. Do not use destructive Git commands such as `reset --hard`, `clean -fd`, or forced checkout to discard work.

## Database and Prisma safeguards

- Inspect the current Prisma schema, migration history, and actual target database state before proposing migrations.
- Compare the migration's expected starting schema with the real database; do not infer database state from migration files alone.
- Test migrations on a disposable/non-production database branch first.
- Check for duplicate values, nullability, foreign-key orphans, table size, locking, backfill needs, and rollback limitations.
- Prefer additive, backward-compatible migrations where possible.
- Coordinate frontend/backend deployment order when schema changes affect running code.
- Never run production migrations, `migrate resolve`, resets, seeds, or data mutations without explicit approval.
- Never run development seed scripts against production unless the owner has explicitly approved a reviewed production-safe procedure.

## CypherVerse product invariants

Do not change these rules without explicit product-owner direction:

- CypherVerse is a Project/Builder/Parcel publishing product, not primarily a 3D asset marketplace.
- `Project.scene` remains the authoritative project scene unless the architecture is deliberately changed.
- One Parcel has one active Project/World.
- `Project.parcelId` is singular and unique; a Project can be attached to at most one Parcel.
- An occupied Parcel deployment must be rejected with a conflict; do not silently replace or detach the existing Project.
- Do not introduce Deployment or World models, copied Parcel scenes, or alternative deployment architecture without an explicit architecture decision.
- Marketplace and CYPH ledger behavior is financially sensitive. Preserve double-entry integrity, idempotency, ownership, and payment reconciliation. Never invent financial rules.

## Security and configuration

- Enforce authorization on the server, not only in the UI.
- Validate untrusted input at API boundaries.
- Never commit `.env` files, credentials, private keys, or production secrets.
- Keep examples in `.env.example` free of real secrets.
- Review dependency and lockfile changes for scope and runtime compatibility.
- Treat authentication, roles, payments, ledger, and ownership changes as high-risk and require focused tests and review.

## Production deployment and rollback

Before deployment, verify:
- Exact approved commit and target branch.
- Build/test status and required environment variables.
- Database migration plan and compatibility with the currently running application.
- Backup/recovery readiness for data-affecting changes.
- Deployment order for frontend, backend, and schema.
- Health checks and critical smoke tests.
- A practical rollback plan, including whether a database rollback is safe or requires a forward fix.

After deployment, verify application health, API responses, authentication, critical user flows, logs, and relevant data invariants. Report what was actually checked.

## Required task report

For each completed task, provide:

1. **Scope:** what was requested and what was intentionally left unchanged.
2. **Audit:** key verified findings and unknowns.
3. **Changes:** exact files and behavior changed.
4. **Checks:** commands run and pass/fail/not-run results.
5. **Risks:** migration, compatibility, security, and deployment considerations.
6. **Git state:** branch, commit/PR status, and working-tree status.
7. **Next action:** the single next step requiring the owner's input or approval.

Be direct and practical. Give short, sequential terminal instructions when the owner must run commands. Clearly state when you cannot access their local machine, VPS, or production environment; never imply that a command was run remotely when it was not.
