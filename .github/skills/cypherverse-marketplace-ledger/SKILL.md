---
name: cypherverse-marketplace-ledger
description: Safely audit and implement CypherVerse marketplace orders, payments, CYPH accounting, double-entry ledger, funding, idempotency, and reconciliation.
---
# CypherVerse Marketplace and CYPH Financial Integrity

## High-risk domain
Treat marketplace and CYPH changes as financial changes. Do not infer or invent pricing, conversion, fee, refund, seller, custody, or accounting policy. Obtain product-owner clarification when a rule is unspecified.

## Audit first
- Trace API → service → store → Prisma models → ledger postings and payment provider integration.
- Identify authoritative balances, account types, transaction lifecycle, status transitions, conversion snapshots, idempotency keys, and audit events.
- Inspect existing migrations, constraints, tests, and production state before proposing schema changes.
- Preserve the current ledger architecture; do not reintroduce obsolete wallet/payment models or parallel accounting paths.

## Invariants
- Double-entry postings must balance for each ledger transaction.
- Financial entries and audit history must be immutable according to existing policy.
- Enforce idempotency under retries and concurrency, not only in process memory.
- Do not mark an order paid based solely on client claims or an unverified callback.
- Verify payment provider signatures and reconcile provider state with internal order/payment state.
- Keep currency, amount precision, conversion rate, and snapshots explicit and consistent.
- Enforce seller/buyer ownership and authorization server-side.
- Never silently create, destroy, or transfer value to repair an inconsistent state.

## Verification
Test success, duplicate requests, retries, concurrent requests, failed/late callbacks, partial failures, refunds/cancellations where supported, rounding, ledger imbalance rejection, and unauthorized access. Use disposable test data/environments.

Never run real charges, payouts, production ledger mutations, or production migrations without explicit approval. Report accounting invariants, test evidence, unresolved policy decisions, and reconciliation results.
