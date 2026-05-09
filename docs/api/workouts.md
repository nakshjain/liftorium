# Workouts API

Base path:

```text
/api/v1/workouts
```

All workout endpoints require authentication.

## Workout Object

```json
{
  "id": "workout_id",
  "userId": "user_id",
  "name": "Push Day",
  "status": "active",
  "startedAt": "2026-05-10T00:00:00.000Z",
  "finishedAt": "2026-05-10T01:05:00.000Z",
  "durationSeconds": 3900,
  "notes": "Felt strong today.",
  "exercises": [
    {
      "id": "workout_exercise_id",
      "exerciseId": "exercise_id",
      "order": 1,
      "supersetGroupId": "push-a",
      "notes": "Keep elbows tucked.",
      "sets": [
        {
          "id": "set_id",
          "order": 1,
          "reps": 8,
          "weight": 80,
          "restTimeSeconds": 120,
          "durationSeconds": 40,
          "rpe": 8,
          "isWarmup": false,
          "setType": "standard",
          "tempo": {
            "eccentric": 3,
            "pauseBottom": 1,
            "concentric": 1,
            "pauseTop": 0
          },
          "notes": "Clean reps.",
          "completedAt": "2026-05-10T00:20:00.000Z"
        }
      ]
    }
  ],
  "createdAt": "2026-05-10T00:00:00.000Z",
  "updatedAt": "2026-05-10T01:05:00.000Z"
}
```

## Start Workout

```http
POST /api/v1/workouts
```

### Request Body

```json
{
  "name": "Push Day",
  "startedAt": "2026-05-10T00:00:00.000Z",
  "notes": "Focus on controlled pressing."
}
```

### Notes

Only one active workout is allowed per user.

## Get Active Workout

```http
GET /api/v1/workouts/active
```

Returns `workout: null` when no active workout exists.

## Get Workout

```http
GET /api/v1/workouts/:workoutId
```

Returns an active or completed workout owned by the authenticated user.

## List Workout History

```http
GET /api/v1/workouts/history
```

### Query Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | number | No | Page number. Defaults to `1` |
| `limit` | number | No | Page size. Defaults to `20`, max `100` |

History returns completed workouts only.

## Add Exercise To Workout

```http
POST /api/v1/workouts/:workoutId/exercises
```

### Request Body

```json
{
  "exerciseId": "exercise_id",
  "supersetGroupId": "push-a",
  "notes": "Pair with cable fly."
}
```

`supersetGroupId` is optional and reserved for grouping exercises into supersets.

## Add Set

```http
POST /api/v1/workouts/:workoutId/exercises/:workoutExerciseId/sets
```

### Request Body

```json
{
  "reps": 8,
  "weight": 80,
  "restTimeSeconds": 120,
  "durationSeconds": 40,
  "rpe": 8,
  "isWarmup": false,
  "setType": "standard",
  "tempo": {
    "eccentric": 3,
    "pauseBottom": 1,
    "concentric": 1,
    "pauseTop": 0
  },
  "notes": "Clean reps.",
  "completedAt": "2026-05-10T00:20:00.000Z"
}
```

Supported set types:

- `standard`
- `warmup`
- `dropset`

## Remove Set

```http
DELETE /api/v1/workouts/:workoutId/exercises/:workoutExerciseId/sets/:setId
```

Removes a set from an active workout and reorders remaining sets.

## Finish Workout

```http
POST /api/v1/workouts/:workoutId/finish
```

### Request Body

```json
{
  "finishedAt": "2026-05-10T01:05:00.000Z",
  "durationSeconds": 3900,
  "notes": "Good session."
}
```

If `durationSeconds` is omitted, the backend calculates it from `startedAt` and `finishedAt`.

## Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `AUTHENTICATION_REQUIRED` | Access token is missing or invalid |
| `404` | `WORKOUT_NOT_FOUND` | Workout does not exist or is not owned by the user |
| `404` | `WORKOUT_EXERCISE_NOT_FOUND` | Workout exercise entry does not exist |
| `404` | `WORKOUT_SET_NOT_FOUND` | Workout set does not exist |
| `404` | `EXERCISE_NOT_FOUND` | Catalog exercise does not exist |
| `409` | `ACTIVE_WORKOUT_EXISTS` | User already has an active workout |
| `409` | `WORKOUT_NOT_ACTIVE` | Mutation requires an active workout |
| `422` | `VALIDATION_ERROR` | Body, query, or route parameter validation failed |
