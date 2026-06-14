# Liftorium

Liftorium is a production-minded workout tracking application designed for fast, focused use during real gym sessions.

## Current Status

Implemented:

- Angular frontend scaffold and authentication flow.
- Spring Boot backend foundation.
- JWT authentication with refresh-token cookies.
- MongoDB user, refresh token, exercise, and workout persistence.
- Exercise database API.
- Workout session API.
- Documentation structure, progress logs, and architecture decisions.

Next focus:

- Backend integration tests.
- Frontend auth and workout flow tests.
- Connecting the workout UI to the Spring Boot APIs.

## Tech Stack

Frontend:

- Angular
- TypeScript
- Standalone components
- Angular Signals
- TailwindCSS

Backend:

- Java 21
- Spring Boot 4.0.6
- Maven
- Spring Security
- Spring Data MongoDB
- JWT authentication
- Resend transactional email for OTP delivery
- Lombok
- Jakarta Validation

Database:

- MongoDB

## Architecture

```text
User
  -> Angular Frontend
  -> Spring Boot REST API
  -> MongoDB
```

Backend request flow:

```text
Spring Security
  -> JWT filter
  -> REST controller
  -> Service
  -> Repository
  -> MongoDB
```

## Repository Structure

```text
gym/
  backend/
    pom.xml
    src/main/java/com/liftorium/
      config/
      controller/
      dto/
      entity/
      exception/
      repository/
      security/
      service/
      util/
    src/main/resources/application.properties
  frontend/
  docs/
```

## Backend Setup

Prerequisites:

- Java 21 or newer runtime capable of building Java 21 bytecode
- Maven
- MongoDB running locally or a MongoDB Atlas connection string

Run locally:

```bash
cd backend
mvn spring-boot:run
```

Build:

```bash
cd backend
mvn clean package
java -jar target/liftorium-backend-0.1.0.jar
```

Configuration is defined with Spring Boot profile-specific `.properties` files:

```text
backend/src/main/resources/application.properties
backend/src/main/resources/application-development.properties
backend/src/main/resources/application-production.properties
```

The root file contains the application name and default development profile. Development values live in the development profile file. Production values live in the production profile file and resolve secrets from environment variables.

Required secrets include MongoDB, JWT secrets, and Resend email credentials:

```text
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Liftorium <onboarding@your-domain.com>
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend scripts:

```bash
npm start
npm run build
npm test
```

## API

Base API path:

```text
/api/v1
```

Authentication endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/register/initiate`
- `POST /api/v1/auth/register/verify`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

See [API Documentation](./docs/api/README.md) for full contracts.

## Documentation

Start here: [Project Documentation](./docs/README.md)

Important documents:

- [Backend Architecture](./docs/architecture/backend.md)
- [Security Architecture](./docs/architecture/security.md)
- [API Documentation](./docs/api/README.md)
- [Progress Log](./docs/progress/progress-log.md)
- [Architecture Decisions](./docs/decisions/README.md)

## Roadmap

| Priority | Feature | Status |
| --- | --- | --- |
| 1 | Authentication | In progress |
| 2 | Workout tracking | In progress |
| 3 | Exercise database | In progress |
| 4 | Workout history | In progress |
| 5 | Progress analytics | Not started |
| 6 | PR tracking | Not started |

## Development Quality Bar

- Production-ready implementations.
- Small reusable modules.
- Layered backend architecture.
- Strict TypeScript on the frontend.
- Java 21 backend with constructor injection and validation.
- Documentation updated with feature work.
- Meaningful commits after stable changes.
