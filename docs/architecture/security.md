# Security Architecture

## Authentication

Gym Helper uses JWT access tokens and refresh tokens.

Access tokens should be short-lived. Refresh tokens should be persisted in hashed form and revocable.

Current implementation:

- Access tokens are returned in JSON responses.
- Refresh tokens are stored in HTTP-only cookies.
- Refresh tokens are persisted only as deterministic HMAC-SHA256 hashes.
- Refresh tokens are rotated on refresh.
- Logout revokes the active refresh token.
- Frontend stores the access token in local storage and keeps auth state in Angular Signals.
- Frontend sends refresh requests with credentials so the HTTP-only refresh cookie is included.

## Token Strategy

| Token | Purpose | Storage | Lifetime |
| --- | --- | --- | --- |
| Access token | Authorize API requests | Frontend memory or secure client strategy | Short |
| Refresh token | Renew access tokens | Secure cookie preferred | Longer |

The backend uses an HTTP-only refresh token cookie scoped to `/api/v1/auth`.

The frontend access token storage strategy is an MVP tradeoff. Future hardening should evaluate in-memory access tokens, stricter CSP, and broader XSS protections before production launch.

## Password Handling

- Store password hashes only.
- Use a strong password hashing algorithm.
- Never log passwords or tokens.
- Validate password strength on registration.

## Authorization

- Users may access only their own workouts, custom exercises, history, and progress data.
- Shared exercise catalog entries may be visible to all authenticated users.
- Repository queries must include `userId` constraints for user-owned data.

## API Security Controls

- Validate every request body, query, and route parameter.
- Use centralized error responses without leaking internals.
- Configure CORS explicitly.
- Use environment variables for secrets.
- Add rate limiting for auth endpoints before production launch.
