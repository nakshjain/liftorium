# Exercises API

Base path:

```text
/api/v1/exercises
```

Exercise reads are public for catalog browsing. Exercise mutations currently require authentication.

## Exercise Object

```json
{
  "id": "exercise_id",
  "name": "Incline Dumbbell Press",
  "description": "A chest-focused pressing movement performed on an incline bench.",
  "category": "strength",
  "equipment": "dumbbell",
  "targetMuscles": ["chest"],
  "secondaryMuscles": ["triceps", "shoulders"],
  "instructions": [
    "Set an incline bench to a moderate angle.",
    "Press the dumbbells upward until arms are extended.",
    "Lower under control."
  ],
  "tips": ["Keep shoulder blades set.", "Control the eccentric."],
  "mediaUrl": "https://example.com/incline-dumbbell-press.mp4",
  "createdAt": "2026-05-10T00:00:00.000Z",
  "updatedAt": "2026-05-10T00:00:00.000Z"
}
```

## List Exercises

```http
GET /api/v1/exercises
```

### Query Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | number | No | Page number. Defaults to `1` |
| `limit` | number | No | Page size. Defaults to `20`, max `100` |
| `search` | string | No | Text search by exercise name |
| `muscleGroup` | string | No | Filters exercises where target or secondary muscles include the value |
| `equipment` | string | No | Filters by equipment |
| `category` | string | No | Filters by category |

### Success Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Get Exercise

```http
GET /api/v1/exercises/:exerciseId
```

### Success Response

```json
{
  "success": true,
  "data": {
    "exercise": {}
  }
}
```

## Create Exercise

```http
POST /api/v1/exercises
```

Requires authentication.

### Request Body

```json
{
  "name": "Incline Dumbbell Press",
  "description": "A chest-focused pressing movement performed on an incline bench.",
  "category": "strength",
  "equipment": "dumbbell",
  "targetMuscles": ["chest"],
  "secondaryMuscles": ["triceps", "shoulders"],
  "instructions": [
    "Set an incline bench to a moderate angle.",
    "Press the dumbbells upward until arms are extended.",
    "Lower under control."
  ],
  "tips": ["Keep shoulder blades set.", "Control the eccentric."],
  "mediaUrl": "https://example.com/incline-dumbbell-press.mp4"
}
```

## Update Exercise

```http
PATCH /api/v1/exercises/:exerciseId
```

Requires authentication. Send any subset of create fields. At least one field is required.

## Delete Exercise

```http
DELETE /api/v1/exercises/:exerciseId
```

Requires authentication.

### Success Response

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `AUTHENTICATION_REQUIRED` | Mutation request is missing a valid access token |
| `404` | `EXERCISE_NOT_FOUND` | Exercise does not exist |
| `422` | `VALIDATION_ERROR` | Body, query, or route parameter validation failed |
