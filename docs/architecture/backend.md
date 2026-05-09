# Backend Architecture

## Stack

- Node.js
- Express
- TypeScript
- MongoDB
- JWT authentication with refresh tokens

## Design Goals

- Modular domain-based structure.
- Controller/service/repository separation.
- Centralized request validation.
- Centralized error handling.
- Strict TypeScript without `any`.
- Environment-driven configuration.

## Proposed Folder Structure

```text
backend/src
  config/
  modules/
    auth/
      auth.controller.ts
      auth.routes.ts
      auth.service.ts
      auth.repository.ts
      auth.validation.ts
      auth.types.ts
    users/
    exercises/
    workouts/
  middleware/
    auth.middleware.ts
    error.middleware.ts
    validate.middleware.ts
  shared/
    errors/
    types/
    utils/
  app.ts
  server.ts
```

## Implemented Auth Foundation

The backend currently includes:

- Express app bootstrap in `src/app.ts`.
- MongoDB connection setup in `src/config/mongodb.ts`.
- Environment validation in `src/config/env.ts`.
- Centralized error middleware.
- Zod request body validation middleware.
- JWT auth module under `src/modules/auth`.
- Exercise database module under `src/modules/exercises`.
- User persistence under `src/modules/users`.
- HTTP-only refresh token cookie support.

## Request Flow

```text
Route
  -> Validation Middleware
  -> Auth Middleware when required
  -> Controller
  -> Service
  -> Repository
  -> MongoDB
```

## Error Handling

All errors should pass through centralized error middleware.

Recommended error shape:

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

## API Response Shape

Recommended success shape:

```json
{
  "success": true,
  "data": {}
}
```

## Module Rules

- Routes define URL bindings only.
- Controllers translate HTTP input/output.
- Services own business logic.
- Repositories own database access.
- Validation files define request schemas.
- Types are explicit and exported from feature modules when shared.

## Exercise Module

The exercise module follows the same controller/service/repository structure:

- `exercise.routes.ts` defines REST endpoints and middleware.
- `exercise.controller.ts` handles HTTP response shapes.
- `exercise.service.ts` handles not-found behavior and DTO mapping.
- `exercise.repository.ts` owns Mongoose queries and pagination.
- `exercise.validation.ts` owns Zod body, query, and param schemas.
- `exercise.types.ts` defines DTOs and paginated response types.
