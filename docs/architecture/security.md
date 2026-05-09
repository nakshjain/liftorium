# Security Architecture

## Authentication

Gym Helper uses JWT access tokens and refresh tokens.

Access tokens should be short-lived. Refresh tokens should be persisted in hashed form and revocable.

## Token Strategy

| Token | Purpose | Storage | Lifetime |
| --- | --- | --- | --- |
| Access token | Authorize API requests | Frontend memory or secure client strategy | Short |
| Refresh token | Renew access tokens | Secure cookie preferred | Longer |

Final storage details should be confirmed during implementation based on frontend/backend deployment topology.

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
