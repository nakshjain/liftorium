# Progress API

Base path: `/api/v1/progress`

All endpoints require a valid JWT (`Authorization: Bearer <token>`).

---

## GET /progress/overview

Returns a summary of the authenticated user's lifetime progression.

**Response**

```json
{
  "success": true,
  "data": {
    "totalPrs": 42,
    "exercisesImproved": 8,
    "latestPrDate": "2025-06-10T18:30:00Z",
    "strongestExercise": {
      "exerciseId": "...",
      "exerciseName": "Squat",
      "weightPr": 140.0
    }
  }
}
```

---

## GET /progress/exercises

Paginated list of exercise progress records.

**Query params**

| Param  | Default | Description                            |
|--------|---------|----------------------------------------|
| page   | 1       | Page number (1-indexed)                |
| limit  | 20      | Page size (max 100)                    |
| search | —       | Filter by exercise name (partial match)|

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "exerciseId": "...",
        "exerciseName": "Bench Press",
        "weightPr": 100.0,
        "repPr": { "weight": 90.0, "reps": 10 },
        "estimatedOneRepMaxPr": 120.0,
        "totalPrs": 5,
        "lastImprovedAt": "2025-06-10T18:30:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

## GET /progress/exercises/{exerciseId}

Full progress detail for a single exercise.  
Includes starting values to support "Started → Now" summaries.

**Response**

```json
{
  "success": true,
  "data": {
    "exerciseId": "...",
    "exerciseName": "Bench Press",
    "firstWeightPr": 20.0,
    "weightPr": 47.5,
    "repPr": { "weight": 40.0, "reps": 12 },
    "firstEstimatedOneRepMax": 38.0,
    "estimatedOneRepMaxPr": 60.2,
    "totalPrs": 12,
    "lastImprovedAt": "2025-06-10T18:30:00Z"
  }
}
```

| Field                    | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `firstWeightPr`          | The very first weight PR recorded. Null until first PR achieved. |
| `weightPr`               | Current all-time weight record.                                  |
| `firstEstimatedOneRepMax`| The first e1RM PR recorded. Null until first PR achieved.        |
| `estimatedOneRepMaxPr`   | Current all-time estimated 1RM record.                           |

---

## GET /progress/exercises/{exerciseId}/history

Chronological progression history for a single exercise.  
Returns one entry per **completed workout** that included this exercise — regardless of whether a PR was set. This is the primary data source for progression charts.

**Response**

```json
{
  "success": true,
  "data": {
    "exerciseId": "...",
    "exerciseName": "Bench Press",
    "entries": [
      {
        "id": "...",
        "workoutId": "...",
        "bestWeight": 35.0,
        "bestSetWeight": 35.0,
        "bestSetReps": 6,
        "estimatedOneRepMax": 42.0,
        "performedAt": "2025-05-01T10:00:00Z"
      },
      {
        "id": "...",
        "workoutId": "...",
        "bestWeight": 45.0,
        "bestSetWeight": 45.0,
        "bestSetReps": 5,
        "estimatedOneRepMax": 52.5,
        "performedAt": "2025-05-08T10:00:00Z"
      }
    ]
  }
}
```

| Field              | Description                                                              |
|--------------------|--------------------------------------------------------------------------|
| `bestWeight`       | Highest weight lifted in any set during this workout.                    |
| `bestSetWeight`    | Weight of the set with the highest estimated 1RM.                        |
| `bestSetReps`      | Reps of the set with the highest estimated 1RM.                          |
| `estimatedOneRepMax` | Epley e1RM derived from the best set. Rounded to 2 decimal places.    |
| `performedAt`      | Workout completion timestamp.                                            |

> **Chart note:** Plot `bestWeight` over `performedAt` to get the clean progression story: `35 → 45 → 47.5`.

---

## GET /progress/prs

Paginated PR event timeline.

**Query params**

| Param      | Default | Description                                            |
|------------|---------|--------------------------------------------------------|
| page       | 1       | Page number (1-indexed)                                |
| limit      | 20      | Page size (max 100)                                    |
| prType     | —       | Filter: `WEIGHT`, `REPS`, `ESTIMATED_ONE_REP_MAX`      |
| exerciseId | —       | Filter by exercise                                     |

**Response**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "exerciseId": "...",
        "exerciseName": "Bench Press",
        "prType": "WEIGHT",
        "value": 47.5,
        "previousValue": 35.0,
        "newValue": 47.5,
        "workoutId": "...",
        "achievedAt": "2025-06-10T18:30:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

| Field           | Description                                                               |
|-----------------|---------------------------------------------------------------------------|
| `value`         | The achieved value (kept for backward compatibility).                     |
| `previousValue` | The record value before this PR. `null` if this is the exercise's first PR.|
| `newValue`      | The new record value. Equals `value`.                                     |

> **Timeline note:** Use `previousValue` and `newValue` to render transitions like `35kg → 47.5kg`.
