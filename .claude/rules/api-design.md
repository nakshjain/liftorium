---
description: REST API design standards, endpoint conventions, and response contracts
globs: ["backend/src/main/java/com/liftorium/controller/**", "backend/src/main/java/com/liftorium/dto/**"]
---

# API Design

## Versioning

* All public endpoints must be versioned.
* Current version prefix: `/api/v1`.

Examples:

```text
/api/v1/workouts
/api/v1/exercises
/api/v1/plans
```

## Resource Design

* Use resource-oriented URLs.
* Use nouns, not verbs.
* Prefer plural resource names.

Examples:

```text
GET    /api/v1/workouts
GET    /api/v1/workouts/{workoutId}
POST   /api/v1/workouts
PUT    /api/v1/workouts/{workoutId}
DELETE /api/v1/workouts/{workoutId}
```

Nested resources:

```text
/api/v1/workouts/{workoutId}/exercises/{exerciseId}/sets
```

## Response Contract

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Pagination

Request:

```text
?page=1&limit=20
```

Rules:

* `page` is 1-based.
* Default limit: 20.
* Maximum limit: 100.

Response:

```json
{
  "items": [],
  "totalPages": 0,
  "totalItems": 0,
  "currentPage": 1
}
```

* Use cursor-based pagination for large searchable exercise catalogs.

## Validation

* Apply Jakarta Validation annotations to request DTOs.
* Use `@Valid` on controller request bodies.
* Validate path IDs before processing requests.

## HTTP Status Codes

Use standard REST status codes:

* 200 OK
* 201 Created
* 204 No Content
* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* 409 Conflict
* 422 Unprocessable Entity
* 500 Internal Server Error

## DTO Design

* Use Java records for DTOs.
* Separate request and response DTOs when responsibilities differ.
* Never expose persistence entities directly through APIs.
