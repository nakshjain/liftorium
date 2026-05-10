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
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
REFRESH_TOKEN_COOKIE_NAME=gym_refresh_token
```

`MONGODB_URI` must include the database name in the URI path, for example `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority`. Keep real MongoDB credentials out of committed files and provide production values through the runtime environment, CI/CD secret store, Kubernetes Secret, or platform secret manager.

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
- [ ] CORS origin set to the deployed frontend URL.
- [ ] HTTPS enabled before production cookie `Secure` rollout.
- [ ] Backend and frontend health checks configured.
