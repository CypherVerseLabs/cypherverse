---
name: cypherverse-security-audit
description: Audit CypherVerse application security, authentication, authorization, roles, secrets, dependencies, API exposure, and deployment configuration.
---
# CypherVerse Security and Authentication Audit

## Scope
Inspect actual auth flow, session/JWT handling, role model, middleware, API routes, frontend guards, CORS, cookies, upload handling, dependencies, and deployment configuration. Trace identity from authentication to authorization decisions.

## Required checks
- Enforce authorization on backend endpoints and object ownership checks.
- Verify token signature, issuer/audience/expiry as applicable; do not trust decoded-but-unverified claims.
- Review cookie flags, CSRF exposure, CORS allowlists, rate limits, password/reset flows, and session invalidation.
- Check IDOR, privilege escalation, mass assignment, injection, SSRF, unsafe file uploads, and sensitive error leakage.
- Review dependencies against current advisories and verify patched versions actually resolve in lockfiles/build artifacts.
- Ensure secrets are absent from source, logs, client bundles, and committed environment files.
- Confirm admin actions are separately authorized and audited.
- Distinguish security controls implemented in source from controls configured at hosting/provider level.

## Reporting
Classify findings by severity and evidence. For each finding provide affected file/route, exploit preconditions, impact, verified evidence, minimal remediation, and regression test. Mark unverified infrastructure assumptions as UNKNOWN. Do not claim a system is secure from a limited scan.

Do not rotate credentials, change production access, alter roles, deploy patches, or modify production environment settings without explicit owner approval.
