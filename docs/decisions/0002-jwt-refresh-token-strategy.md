# ADR 0002: JWT Refresh Token Strategy

## Status

Accepted

## Date

2026-05-10

## Context

Gym Helper needs authentication that works well for a mobile-first web app while keeping API authorization simple and refresh sessions revocable.

The backend must support short-lived access tokens, refresh tokens, logout, and future session invalidation.

## Decision

Use short-lived JWT access tokens returned in API responses and longer-lived JWT refresh tokens stored in HTTP-only cookies.

Persist refresh tokens in MongoDB as deterministic HMAC-SHA256 hashes. Rotate refresh tokens during refresh by revoking the current token and issuing a new token.

## Consequences

Access tokens remain stateless and easy for the API to verify.

Refresh sessions can be revoked because the backend stores refresh token records.

Raw refresh tokens are never persisted, reducing impact if the database is exposed.

The frontend must call the refresh endpoint with credentials enabled so the HTTP-only cookie is sent.

## Alternatives Considered

- Store raw refresh tokens: simpler lookup, but weaker security.
- Store bcrypt refresh token hashes: strong for password-style verification, but unsuitable for direct lookup because bcrypt hashes are salted.
- Use access tokens only: simpler, but no secure session renewal or revocation.
