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
