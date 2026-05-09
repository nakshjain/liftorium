# Exercises API

Base path:

```text
/api/v1/exercises
```

## List Exercises

```http
GET /api/v1/exercises
```

### Query Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `search` | string | No | Search by exercise name |
| `muscleGroup` | string | No | Filter by primary muscle group |
| `equipment` | string | No | Filter by equipment |

## Get Exercise

```http
GET /api/v1/exercises/:exerciseId
```

## Create Custom Exercise

```http
POST /api/v1/exercises
```

Requires authentication.

### Request Body

```json
{
  "name": "Incline Dumbbell Press",
  "primaryMuscleGroup": "chest",
  "secondaryMuscleGroups": ["triceps", "shoulders"],
  "equipment": "dumbbell",
  "movementPattern": "push"
}
```

## Update Custom Exercise

```http
PATCH /api/v1/exercises/:exerciseId
```

Requires authentication and ownership.

## Delete Custom Exercise

```http
DELETE /api/v1/exercises/:exerciseId
```

Requires authentication and ownership.
