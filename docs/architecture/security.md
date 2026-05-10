# Security Architecture

Gym Helper uses Spring Security with JWT access tokens and refresh-token cookies.

## Authentication

- Users register and log in through `/api/v1/auth`.
- Passwords are hashed with BCrypt.
- Successful login/register returns a JWT access token in the response body.
- A JWT refresh token is stored in an HTTP-only cookie scoped to `/api/v1/auth`.

## Refresh Tokens

- Refresh tokens are stored in MongoDB as HMAC-SHA256 hashes.
- Raw refresh tokens are never persisted.
- Refresh rotates the current token by revoking the old record and issuing a new one.
- Logout revokes the active refresh token and clears the cookie.

## Route Protection

- `JwtAuthenticationFilter` validates bearer access tokens.
- Spring Security sets the authenticated `UserPrincipal`.
- Workout routes and mutating exercise routes require authentication.
- User roles are stored as authorities, starting with `ROLE_USER`, so role-based authorization can be added without changing the user model.

## API Errors

Authentication and authorization failures use the same response envelope as the rest of the API:

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required",
    "details": []
  }
}
```
