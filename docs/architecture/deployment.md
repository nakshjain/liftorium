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
CORS_ORIGIN=https://liftorium.fit
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

## Domain and Proxy Strategy

Use `https://liftorium.fit` as the public frontend origin and keep API calls same-origin through `/api`.

Production routing:

```text
https://liftorium.fit/api/* -> Spring Boot backend
https://liftorium.fit/*     -> Angular static frontend
```

The Angular production environment should use a relative API base URL:

```text
/api/v1
```

This keeps browser API calls same-origin, avoids production CORS complexity, and keeps refresh-token cookie behavior tied to `liftorium.fit`.

If the same-origin proxy cannot be supported by the hosting platform, use `https://api.liftorium.fit` as the fallback backend origin and update only the Angular production API base URL plus `CORS_ORIGIN`.

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
- [ ] `/api/*` reverse proxy routes to the backend before Angular fallback routing.
- [ ] CORS origin set to `https://liftorium.fit`.
- [ ] HTTPS enabled before production cookie `Secure` rollout.
- [ ] Backend and frontend health checks configured.
