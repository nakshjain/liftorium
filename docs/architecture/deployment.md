# Deployment Notes

> Reflects the current implemented configuration.
> Environment variable names are sourced from `application.properties`.

---

## Domain Strategy

```
https://liftorium.fit          →  Angular static frontend
https://api.liftorium.fit      →  Spring Boot backend  (port 4000)
```

The Angular production environment uses `https://api.liftorium.fit/api/v1` as its API base URL. The backend production CORS origin is `https://liftorium.fit`.

---

## Backend

### Build

Prerequisites: Java 21, Maven.

```bash
cd backend
mvn clean package
```

Produces:

```
backend/target/liftorium-backend-0.1.0.jar
```

### Run

```bash
java -jar target/liftorium-backend-0.1.0.jar
```

Or with an explicit profile:

```bash
java -Dspring.profiles.active=production -jar target/liftorium-backend-0.1.0.jar
```

Default port: `4000`. Override with the `PORT` environment variable.

### Spring Profiles

| Profile | Purpose |
|---|---|
| `development` (default) | Local development values; MongoDB URI from local config |
| `production` | All secrets from environment variables; MongoDB auto-index creation disabled |

Set the active profile via:

```
SPRING_PROFILES_ACTIVE=production
```

### Environment Variables

All required secrets must be provided through the runtime environment, CI/CD secret store, Kubernetes Secret, or platform secret manager. Do not commit real values to source control.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | Full MongoDB connection string including database name |
| `JWT_ACCESS_SECRET` | Yes | — | HMAC-SHA256 signing key for access tokens — minimum 32 characters |
| `JWT_REFRESH_SECRET` | Yes | — | HMAC-SHA256 signing key and hash salt for refresh tokens — minimum 32 characters |
| `RESEND_API_KEY` | Yes | — | Resend email API key |
| `RESEND_FROM_EMAIL` | Yes | — | Verified Resend sender address, e.g. `Liftorium <onboarding@liftorium.fit>` |
| `CORS_ORIGINS` | Yes | `http://localhost:4200` | Allowed frontend origin — set to `https://liftorium.fit` in production |
| `SPRING_PROFILES_ACTIVE` | Yes | `development` | Set to `production` for production deployments |
| `PORT` | No | `4000` | HTTP server port |
| `ACCESS_TOKEN_TTL` | No | `15m` | Access token lifetime — format: `15m`, `1h` |
| `REFRESH_TOKEN_TTL` | No | `30d` | Refresh token lifetime — format: `30d` |
| `REFRESH_TOKEN_COOKIE_NAME` | No | `liftorium_refresh_token` | HttpOnly cookie name for the refresh token |
| `BCRYPT_STRENGTH` | No | `10` | BCrypt cost factor — increase for production after benchmarking login latency |
| `EXERCISE_SYNC_ON_STARTUP` | No | `false` | Set `true` to sync the exercise catalog from Wger on boot |

`MONGODB_URI` must include the database name in the connection string path:

```
mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

`RESEND_FROM_EMAIL` must use a domain verified in the Resend dashboard.

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different values. Both are used as HMAC-SHA256 signing keys; `JWT_REFRESH_SECRET` is additionally used as the HMAC key for refresh token hashing.

---

## Frontend

### Build

Prerequisites: Node.js.

```bash
cd frontend
npm run build
```

The production build outputs to `frontend/dist/`. Deploy the contents of that directory to any static hosting provider.

The production Angular environment uses:

```
https://api.liftorium.fit/api/v1
```

as the API base URL. This is compiled into the build. To change it, update the production environment file before building.

---

## Cookie Security

The refresh token cookie is set as `HttpOnly; SameSite=Strict; Path=/api/v1/auth`.

The `Secure` attribute is only added when the active Spring profile is `production`. Ensure HTTPS is in place before activating the production profile, or the `Secure` cookie will not be sent by browsers over HTTP.

The cookie name `liftorium_refresh_token` is the default and can be overridden with `REFRESH_TOKEN_COOKIE_NAME`. The path `/api/v1/auth` is hardcoded in `application.properties` via `app.jwt.refresh-token-cookie-path`.

---

## Deployment Checklist

- [ ] Java 21 runtime available on the host
- [ ] `SPRING_PROFILES_ACTIVE=production`
- [ ] `MONGODB_URI` set and connection tested — include the database name in the URI
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` generated independently, each at least 32 characters
- [ ] `RESEND_API_KEY` configured and sender domain verified in Resend
- [ ] `RESEND_FROM_EMAIL` uses a verified sender on the Resend account
- [ ] `CORS_ORIGINS` set to `https://liftorium.fit`
- [ ] HTTPS enabled — required before the `Secure` cookie attribute is enforced
- [ ] `api.liftorium.fit` DNS record pointing to the backend host
- [ ] `liftorium.fit` DNS record pointing to the frontend host / CDN
- [ ] `BCRYPT_STRENGTH` tuned for production hardware
- [ ] Frontend built with the production environment file and deployed to static hosting
- [ ] `GET /health` endpoint returns `200` after deployment
