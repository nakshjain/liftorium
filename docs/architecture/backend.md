# Backend Architecture

## Stack

- Java 21
- Spring Boot 4.0.6
- Maven
- MongoDB with Spring Data MongoDB
- Spring Security
- JWT access tokens and refresh tokens
- Lombok
- Jakarta Validation

## Design Goals

- Preserve the existing `/api/v1` API behavior wherever possible.
- Keep controller, service, and repository concerns separate.
- Use constructor injection only.
- Centralize validation, authentication, authorization, and error handling.
- Keep MongoDB documents compatible with the existing MVP data model.
- Remain role-ready through Spring Security authorities.

## Folder Structure

```text
backend/src/main/java/com/liftorium
  config/
    cors/
    jwt/
    security/
  controller/
  dto/
  entity/
  exception/
  repository/
  security/
  service/
  util/
  LiftoriumApplication.java
backend/src/main/resources/application.properties
```

## Request Flow

```text
HTTP request
  -> Spring Security filter chain
  -> JWT authentication filter when a bearer token is present
  -> Controller with Jakarta Validation
  -> Service business rules
  -> Spring Data Mongo repository
  -> MongoDB
```

## Modules

- Auth: registration, login, current user, refresh rotation, logout, BCrypt password hashing, and refresh-token persistence.
- Email: OTP and password reset delivery through Resend's Email API.
- Exercises: catalog CRUD, pagination, filtering, search, and Mongo indexes.
- Workouts: authenticated user-owned sessions, active workout rules, exercise additions, set add/remove, completion, and history pagination.

## Security Architecture

- Access tokens are short-lived JWTs returned in API responses.
- Refresh tokens are JWTs stored in an HTTP-only `SameSite=Strict` cookie scoped to `/api/v1/auth`.
- Refresh token records are persisted as deterministic HMAC-SHA256 hashes in MongoDB.
- Refresh rotates the token by revoking the current record and issuing a new token.
- Protected routes are enforced by Spring Security and `JwtAuthenticationFilter`.
- Roles are stored on the user document as Spring Security authorities, starting with `ROLE_USER`.

## API Response Shape

Success responses keep the existing envelope:

```json
{
  "success": true,
  "data": {}
}
```

Error responses keep the existing envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

## Configuration

Spring Boot reads configuration from profile-specific `.properties` files:

- `application.properties`: application name and default active profile only.
- `application-development.properties`: development server port, Atlas MongoDB URI, development logging, auto-index creation, and development JWT values.
- `application-production.properties`: environment placeholders, reduced logging, and disabled MongoDB auto-index creation.

Key environment variables:

- `PORT`
- `SPRING_PROFILES_ACTIVE`
- `MONGODB_URI`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`
- `REFRESH_TOKEN_COOKIE_NAME`
