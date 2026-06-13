---
description: REST API design conventions and endpoint patterns
globs: ["backend/src/main/java/com/liftorium/controller/**", "backend/src/main/java/com/liftorium/dto/**"]
---

# API Design

## URL Structure
- All endpoints under `/api/v1/`.
- Resource-oriented: `/api/v1/workouts`, `/api/v1/exercises`, `/api/v1/plans`.
- Nested resources for sub-entities: `/api/v1/workouts/{id}/exercises/{id}/sets`.

## Response Envelope
Every response wraps data in:
```json
{ "success": true, "data": { ... } }
```
Errors use:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

## Pagination
- Query params: `page` (1-based), `limit` (default 20, max 100).
- Response includes `items`, `totalPages`, `totalItems`, `currentPage`.
- Cursor-based pagination for exercise catalog (prefix search).

## Validation
- Jakarta Validation on request DTOs (`@Valid @RequestBody`).
- ObjectId format validated via `ObjectIdValidator.requireValid()` in controllers.
- Return 422 for validation errors, 404 for not found, 401/403 for auth issues.