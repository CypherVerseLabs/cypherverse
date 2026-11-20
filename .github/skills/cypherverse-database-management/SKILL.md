---
name: cypherverse-database-management
description: Safely inspect and change CypherVerse Prisma and Neon databases, schemas, migrations, data, and production database operations.
---
# Prisma and Neon Database Management

## Safety first
- Identify the exact repository, environment, Neon project, branch, database, and schema before any operation.
- Treat local, test, disposable, staging, and production databases as distinct.
- Read the current Prisma schema, migration files, migration status, and actual target database state before recommending changes.
- Never assume migration history proves the live schema matches.
- Never run production DDL, migrations, migrate resolve, reset, seed, backfill, or destructive data operations without explicit owner approval.
- Never run development seed scripts against production. Production parcel data must not be overwritten by general seed commands.

## Migration workflow
1. Inspect current models, relations, constraints, indexes, defaults, and migration history.
2. Compare expected starting state with the actual target database.
3. Check duplicates, nulls, orphaned foreign keys, enum values, table sizes, lock risk, and backfill requirements.
4. Design the smallest compatible migration; prefer additive and expand/contract changes.
5. Test on a disposable Neon branch or equivalent copy.
6. Verify application compatibility before and after the migration.
7. Document deployment order, recovery, and whether rollback is actually safe.
8. Obtain explicit approval before production execution.

## Operational rules
- Do not use migrate reset on shared or production databases.
- Do not mark migrations applied or rolled back merely to silence Prisma; first verify exact DDL and data state.
- Do not edit already-applied migration history casually.
- Preserve production data and reserved parcel records.
- Keep secrets out of logs, shell history, commits, and reports.
- Report exact commands, target identifiers (non-secret), results, and remaining uncertainty.

## Required report
State target environment, verified schema state, migration diff, data checks, test evidence, deployment order, backup/recovery plan, and approval still required. If database access is unavailable, provide read-only commands for the owner rather than claiming inspection.
