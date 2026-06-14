# Deployment Notes

## Backend

The backend deploys as a Spring Boot Java 21 application packaged by Maven.

Build command:

```bash
cd backend
mvn clean package
```

Run command:

```bash
java -jar target/gym-helper-backend-0.1.0.jar
```

Required environment variables:

```text
PORT=4000
SPRING_PROFILES_ACTIVE=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
CORS_ORIGIN=https://<frontend-host>
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Liftorium <onboarding@your-domain.com>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
REFRESH_TOKEN_COOKIE_NAME=gym_refresh_token
```

`MONGODB_URI` must include the database name in the URI path, for example `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority`. Keep real MongoDB credentials out of committed files and provide production values through the runtime environment, CI/CD secret store, Kubernetes Secret, or platform secret manager.

`RESEND_FROM_EMAIL` must use a sender address on a domain verified in Resend. Keep the Resend API key in the same secret-management path as database and JWT secrets.

## Domain and API Strategy

Use `https://liftorium.fit` as the public frontend origin and `https://api.liftorium.fit` as the backend API origin.

Production DNS/routing:

```text
https://liftorium.fit          -> Angular static frontend
https://api.liftorium.fit      -> Spring Boot backend
```

The Angular production environment should use:

```text
https://api.liftorium.fit/api/v1
```

The backend production CORS origin should be `https://liftorium.fit`. The Angular auth interceptor already sends credentials, so refresh-token cookies continue to work against `api.liftorium.fit`.

If a same-origin `/api` reverse proxy is reintroduced later, change only the Angular production API base URL back to `/api/v1`.

## Frontend

The frontend deploys as a static Angular build.

```bash
cd frontend
npm run build
```

## Checklist

- [ ] Java 21 runtime available.
- [ ] MongoDB connection tested.
- [ ] JWT secrets generated securely and at least 32 characters.
- [ ] Resend API key configured and sender domain verified.
- [ ] `api.liftorium.fit` DNS points to the backend host.
- [ ] CORS origin set to `https://liftorium.fit`.
- [ ] HTTPS enabled before production cookie `Secure` rollout.
- [ ] Backend and frontend health checks configured.
