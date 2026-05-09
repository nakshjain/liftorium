# Workouts API

Base path:

```text
/api/v1/workouts
```

All workout endpoints require authentication.

## Create Workout

```http
POST /api/v1/workouts
```

### Request Body

```json
{
  "name": "Push Day",
  "startedAt": "2026-05-10T00:00:00.000Z"
}
```

## Get Active Workout

```http
GET /api/v1/workouts/active
```

## Add Exercise To Workout

```http
POST /api/v1/workouts/:workoutId/exercises
```

### Request Body

```json
{
  "exerciseId": "exercise_id"
}
```

## Add Set

```http
POST /api/v1/workouts/:workoutId/exercises/:exerciseId/sets
```

### Request Body

```json
{
  "weight": 80,
  "reps": 8,
  "isWarmup": false
}
```

## Update Set

```http
PATCH /api/v1/workouts/:workoutId/exercises/:exerciseId/sets/:setOrder
```

## Complete Workout

```http
POST /api/v1/workouts/:workoutId/complete
```

## List Workout History

```http
GET /api/v1/workouts/history
```

## Get Workout

```http
GET /api/v1/workouts/:workoutId
```
