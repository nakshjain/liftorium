# Security Architecture

> Reflects the implemented security model.
> For full sequence diagrams see [auth-flow.md](./auth-flow.md).
> For known tradeoffs and recommendations see [architecture-review.md](./architecture-review.md).

---

## Authentication Overview

Liftorium uses Spring Security with stateless JWT authentication. There are no server-side sessions. Every protected request is authenticated independently by validating the access token in the `JwtAuthenticationFilter`.

Two registration paths exist:

- **OTP-verified registration** (`/auth/register/initiate` → `/auth/register/verify`) — the standard path. Email is verified before the account is created.
- **Direct registration** (`/auth/register`) — retained for backward compatibility and testing.

---

## Registration and OTP Verification

1. Client calls `POST /auth/register/initiate` with email, display name, and password.
2. The backend checks whether the email is already registered. If so, it returns `409 Conflict`.
3. A `PendingRegistration` document is created (or updated) containing the pre-hashed password and a BCrypt-hashed 6-digit OTP.
4. The OTP is delivered via Resend email API. The raw OTP is never logged or persisted.
5. Rate limiting: ≥ 3 initiation attempts within a 10-minute window returns `429 Too Many Requests`.
6. The `PendingRegistration` document has a MongoDB TTL index on `expiresAt` (10 minutes). Expired documents are removed automatically.
7. Client calls `POST /auth/register/verify` with the email and OTP.
8. The OTP is verified with `BCrypt.matches()`. Invalid OTP returns `400 OTP_INVALID`. Expired (missing) document returns `400 OTP_EXPIRED`.
9. On success: user and default settings documents are created, the pending registration is deleted, and a full session is issued.

---

## Login

1. Email is normalised (lowercased, trimmed) before lookup.
2. User not found and password mismatch return the same `401 INVALID_CREDENTIALS` error — identical message, identical HTTP status — to prevent user enumeration.
3. On success a new JWT session is created and the refresh token is persisted as a hash.

---

## Password Reset

1. `POST /auth/forgot-password` always returns a success response regardless of whether the email exists.
2. If the email is registered, a `PasswordResetRequest` document is created with a hashed OTP. The same rate-limit window as registration applies. Rate-limit errors are silently suppressed — no `429` is returned — to prevent enumeration via rate-limit responses.
3. `POST /auth/forgot-password/reset` verifies the OTP, updates the password hash, deletes the reset document, and auto-logs the user in by returning a new session.

---

## Token Architecture

### Access Token

| Property | Value |
|---|---|
| Algorithm | HMAC-SHA256 (JJWT 0.12.6) |
| Signing key | `JWT_ACCESS_SECRET` |
| Default TTL | 15 minutes (configurable via `ACCESS_TOKEN_TTL`) |
| Claims | `sub` = userId, `email`, `displayName`, `iat`, `exp` |
| Transport | `Authorization: Bearer` header |
| Client storage | `localStorage` |
| Server storage | Stateless — not persisted |

The access token is verified statically (signature + expiry) on every request by `JwtAuthenticationFilter`. No database lookup is needed for access token validation.

### Refresh Token

| Property | Value |
|---|---|
| Algorithm | HMAC-SHA256 (JJWT 0.12.6) |
| Signing key | `JWT_REFRESH_SECRET` |
| Default TTL | 30 days (configurable via `REFRESH_TOKEN_TTL`) |
| Claims | `sub` = userId, `tokenId`, `iat`, `exp` |
| Transport | `HttpOnly; SameSite=Strict` cookie, path `/api/v1/auth` |
| Client storage | Browser cookie (never accessible to JavaScript) |
| Server storage | HMAC-SHA256 hash in `refresh_tokens` collection |

### Refresh Token Storage and Rotation

Raw refresh tokens are never stored. The hash is derived by:

```
HMAC-SHA256(rawToken, JWT_REFRESH_SECRET) → hex string → stored in refresh_tokens.tokenHash
```

On every refresh request:

1. The JWT signature and expiry are verified.
2. The token is hashed and looked up in MongoDB. The record must be non-revoked and non-expired.
3. The `tokenId` claim is compared against the persisted document `id` to prevent token substitution attacks.
4. The existing record's `revokedAt` is set to now.
5. A new refresh token and new access token are issued and a new hash record is saved.

This is a single-rotation strategy — each token can be used exactly once.

### Cookie Strategy

The refresh token cookie is set by the backend with:

```
Set-Cookie: liftorium_refresh_token=<JWT>; HttpOnly; SameSite=Strict; Path=/api/v1/auth
```

`Secure` is enabled when the active Spring profile is `production`. In development it is omitted to allow local `http://` testing.

On logout, the cookie is cleared with:

```
Set-Cookie: liftorium_refresh_token=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/api/v1/auth
```

The cookie name (`liftorium_refresh_token`) and path (`/api/v1/auth`) are configurable via `REFRESH_TOKEN_COOKIE_NAME` and `app.jwt.refresh-token-cookie-path`.

---

## Spring Security Filter Chain

```
Incoming request
    │
    ▼
CORS Filter              — validates Origin against CORS_ORIGINS
    │
    ▼
JwtAuthenticationFilter  — extracts Bearer token, validates, loads UserPrincipal into SecurityContext
    │
    ▼
SecurityFilterChain      — authorizeHttpRequests rules:
    │                        /health                          → permitAll
    │                        POST /auth/register*             → permitAll
    │                        POST /auth/login                 → permitAll
    │                        POST /auth/refresh               → permitAll
    │                        POST /auth/forgot-password*      → permitAll
    │                        GET  /exercises, /exercises/*    → permitAll
    │                        anyRequest                       → authenticated()
    ▼
Controller
```

Authentication failures return a structured JSON `401` from `RestAuthenticationEntryPoint` — no redirect to a login page.

---

## Password Hashing

- Algorithm: BCrypt.
- Cost factor: `app.security.bcrypt-strength` / `BCRYPT_STRENGTH`, default `10`.
- Changing the configured strength only affects newly hashed passwords. Existing hashes self-describe their cost factor and continue to verify correctly.
- Production environments should benchmark login latency and set the highest cost factor the hardware tolerates within the acceptable login time budget.

---

## OTP Security

- Generated with `SecureRandom.nextInt(100_000, 1_000_000)` — cryptographically strong, 6 digits.
- Hashed with BCrypt before storage. The raw OTP is passed only to the email service and is never logged or persisted.
- Verified with `BCrypt.matches()`.
- TTL: 10 minutes (configurable via `app.otp.expiry-minutes`).
- Rate limit: 3 attempts per 10-minute window per email (configurable via `app.otp.max-attempts-per-window` and `app.otp.rate-limit-window-minutes`).

---

## Logout Protection

The Angular `TokenStorageService` sets a `loggedOut` flag in `sessionStorage` immediately on logout. The `AuthService.refreshSession()` method checks this flag and short-circuits before making the refresh request. This prevents a silent refresh from being attempted even if the `HttpOnly` refresh cookie is still technically present in the browser during the brief window before `Max-Age=0` takes effect.

---

## Input Validation

- All request bodies are validated with Jakarta Bean Validation (`@Valid`).
- A custom `@StrongPassword` constraint enforces: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit.
- Validation failures return a structured `400` via `GlobalExceptionHandler.handleMethodArgumentNotValid()`.

---

## Route Authorization Summary

| Route pattern | Authentication required |
|---|---|
| `GET /health` | No |
| `POST /api/v1/auth/**` | No (public auth endpoints) |
| `GET /api/v1/exercises`, `GET /api/v1/exercises/*` | No |
| All other `/api/v1/**` routes | Yes — valid JWT required |

---

## Known Security Tradeoffs

These are documented tradeoffs, not bugs. They reflect deliberate decisions given the current project scope. See [architecture-review.md](./architecture-review.md) for mitigation paths.

### Access token in localStorage

The access token is stored in `localStorage` and rehydrated on page load. Any XSS vulnerability grants access to the token. The 15-minute TTL limits the exposure window but does not eliminate the risk.

**Mitigation path:** Move access token to an in-memory signal only. On hard reload, rely on the `HttpOnly` refresh cookie to transparently re-issue via `/auth/refresh`. This eliminates the localStorage surface entirely.

### No refresh token family / reuse detection

If a refresh token is stolen and used before the legitimate user's next request, the legitimate user will see their session broken (the stolen token was rotated), but there is no automated alert or full-session revocation. A single rotation makes it detectable but does not prevent the window of access before detection.

**Mitigation path:** Assign a `familyId` to each session and revoke all tokens in the family when a revoked token is presented (replay detection).

### No access token revocation

Access tokens cannot be revoked before their TTL expires. Logout only revokes the refresh token. A captured access token remains valid for up to 15 minutes post-logout.

**Mitigation path:** Introduce a short-lived revocation cache (e.g. Redis set of revoked JTIs) checked in `JwtAuthenticationFilter`. Only appropriate if near-instant invalidation is a hard requirement.

### No HTTP-layer rate limiting

OTP endpoints have application-level rate limiting. There is no global HTTP-layer rate limiter protecting other endpoints from brute-force or enumeration attacks.

**Mitigation path:** Add a Bucket4j filter or deploy behind an API gateway with rate limiting enforced per IP.
