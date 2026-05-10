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
MONGODB_URI=mongodb://127.0.0.1:27017/gym-helper
CORS_ORIGIN=http://localhost:4200
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
REFRESH_TOKEN_COOKIE_NAME=gym_refresh_token
```

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
