---
name: cypherverse-backend-api
description: Implement and audit CypherVerse backend APIs, Express routes, controllers, services, stores, authentication, authorization, and validation.
---
# CypherVerse Backend and API Development

## Audit before implementation
- Trace the existing request flow: route → middleware → controller → service → store/database.
- Inspect route registration, Express version and routing semantics, error middleware, response conventions, auth context, types, and tests.
- Reuse existing service/store patterns. Do not put business logic in routes or duplicate existing endpoints.
- Verify frontend API callers and response contracts before changing request or response shapes.

## Security and correctness
- Authenticate and authorize on the server for every protected operation; UI hiding is not authorization.
- Derive user identity from verified server auth context, never from a client-supplied owner ID.
- Validate and normalize untrusted path, query, and body input.
- Use explicit status codes and stable machine-readable error codes where existing conventions support them.
- Avoid leaking stack traces, secrets, internal database details, or sensitive account information.
- Make payment, order, ownership, and ledger operations idempotent where required and transaction-safe.
- Handle concurrency and uniqueness races at the database boundary as well as in application logic.
- Keep API types and frontend consumers synchronized.

## Tests
Cover success, invalid input, unauthenticated access, unauthorized access, missing records, conflicts, concurrency/idempotency, and database failures as relevant. Use existing test framework and test helpers; do not add another framework without justification.

## Delivery
List exact routes, controllers, services, stores, types, and tests changed. Run focused backend tests, type checks, and server build where available. Inspect the full diff. Do not change production configuration or deploy without approval.
