# Multi-Tracking-Type Architecture

## Overview

Exercises are now categorised by a `TrackingType` that controls which fields are
captured per set, how the logging UI is rendered, and which PR analytics apply.

---

## TrackingType Enum

| Value         | Example exercises                  | Required set fields              | Optional set fields        |
|---------------|------------------------------------|----------------------------------|----------------------------|
| `WEIGHT_REPS` | Bench Press, Squat, Deadlift       | `reps`, `weight`                 | —                          |
| `REPS_ONLY`   | Pull-Up, Push-Up, Dip              | `reps`                           | `weight`                   |
| `DURATION`    | Plank, Wall Sit, L-Sit, Dead Hang  | `durationSeconds`                | —                          |
| `CARDIO`      | Treadmill, Cycling, Rowing         | `durationSeconds`                | `distanceKm`, `speed`, `incline` |

---

## Schema Changes

### `Exercise` document (exercises collection)

New field added:

```
trackingType: String   // enum: WEIGHT_REPS | REPS_ONLY | DURATION | CARDIO
                       // default: WEIGHT_REPS
```

Existing documents that do not have this field are treated as `WEIGHT_REPS` by
the service layer. No backfill migration required for correctness.

### `WorkoutSet` embedded document (inside workouts collection)

Before:

```
reps:   int   (required)
weight: double (required)
```

After (all fields nullable):

```
reps:            Integer   // WEIGHT_REPS + REPS_ONLY
weight:          Double    // WEIGHT_REPS (required); REPS_ONLY (optional)
durationSeconds: Integer   // DURATION + CARDIO (required)
distanceKm:      Double    // CARDIO (optional)
speed:           Double    // CARDIO (optional)
incline:         Double    // CARDIO (optional)
completedAt:     Instant
```

Existing workout documents continue to deserialise correctly because MongoDB
maps absent fields to `null` and the old `int`/`double` primitives are now
`Integer`/`Double` wrapper types — no data loss.

### `ExerciseProgress` document (exercise_progress collection)

New fields added (default 0):

```
longestDurationSeconds: int
longestDistanceKm:      double
```

Existing documents default these to 0 on read — no migration required.

### `ExerciseProgressHistory` document (exercise_progress_history collection)

Changed:

```
bestWeight:    double  →  Double  (null for DURATION/CARDIO exercises)
bestSetWeight: double  →  Double  (null for DURATION/CARDIO exercises)
```

New fields:

```
bestDurationSeconds: Integer  (null for WEIGHT_REPS/REPS_ONLY)
bestDistanceKm:      Double   (null for non-CARDIO)
```

Existing documents continue to read correctly. New exercises produce
type-appropriate snapshots.

---

## Analytics by TrackingType

| Type          | PR types evaluated                     | History chart Y-axis              |
|---------------|----------------------------------------|-----------------------------------|
| `WEIGHT_REPS` | WEIGHT, REPS, ESTIMATED_ONE_REP_MAX    | Best weight / Estimated 1RM       |
| `REPS_ONLY`   | REPS                                   | Max reps                          |
| `DURATION`    | DURATION                               | Longest duration (seconds)        |
| `CARDIO`      | DURATION, DISTANCE                     | Duration + Distance               |

---

## Validation Strategy

Validation is **not** handled by Jakarta bean-validation annotations on the DTO
because the required-field constraint depends on the `Exercise.trackingType`
value — a separate entity not available at the annotation layer.

Instead, `WorkoutSetValidator` is injected into `WorkoutService.addSet()`. It:

1. Loads the exercise to resolve its `TrackingType`.
2. Validates the request fields against the rules for that type.
3. Throws `AppException(VALIDATION_ERROR, 422)` on any violation.

This keeps DTOs clean and validation logic testable in isolation.

---

## Migration Approach for Existing Data

### Exercises

No migration needed. All existing exercises default to `WEIGHT_REPS`, which
preserves the current behaviour exactly.

To assign tracking types to specific exercises (e.g. mark "Plank" as DURATION),
update the exercise documents directly:

```js
// MongoDB shell — mark all treadmill/cardio machines as CARDIO
db.exercises.updateMany(
  { name: { $in: ["Treadmill", "Stationary Bike", "Rowing Machine", "Elliptical"] } },
  { $set: { trackingType: "CARDIO" } }
)

// Mark isometric holds as DURATION
db.exercises.updateMany(
  { name: { $in: ["Plank", "Wall Sit", "L-Sit", "Dead Hang", "Hollow Hold"] } },
  { $set: { trackingType: "DURATION" } }
)

// Mark bodyweight exercises as REPS_ONLY
db.exercises.updateMany(
  { name: { $in: ["Pull-Up", "Push-Up", "Dip", "Chin-Up"] } },
  { $set: { trackingType: "REPS_ONLY" } }
)
```

### Existing Workout Sets

Existing sets have `reps` and `weight` values. They are read as the new nullable
`Integer`/`Double` types without issue. No backfill required.

### ExerciseProgress / ExerciseProgressHistory

No migration required. New fields default to zero/null on first read of existing
documents.

---

## Risks and Tradeoffs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Exercises without `trackingType` in MongoDB | Low — default is WEIGHT_REPS, preserving all existing behaviour | Service-layer null-safe default |
| Old iOS/Android clients sending only `reps`+`weight` | Low — validation only fires if the exercise's type requires other fields | No breaking change for WEIGHT_REPS exercises |
| `WorkoutStatsService.totalVolume` includes only WEIGHT_REPS sets | Low — volume is only meaningful for weight exercises | Intentional; documented |
| Exercise cache in IndexedDB does not carry `trackingType` until next catalog sync | Medium — user sees stale WEIGHT_REPS UI for exercises that were updated to a different type | Force-bump `catalogVersion` after any bulk tracking-type update; or user can clear cache |
| CARDIO incline/speed fields are logged but not yet shown in history charts | Low — fields are stored and queryable; chart support is a future feature | Tracked in open-tasks |

---

## Frontend Rendering

The `live-workout-page` template uses `exercise.trackingType` to switch the
column layout and input widgets per exercise:

- `WEIGHT_REPS` → 4-column grid: `# | Weight | Reps | Done`
- `REPS_ONLY`   → 3-column grid: `# | Reps | Done`
- `DURATION`    → 3-column grid: `# | Duration (s) | Done`
- `CARDIO`      → 5-column grid: `# | Duration (s) | Dist (km) | Speed | Done`

The `setGridCols(trackingType)` helper returns the correct Tailwind
`grid-cols-*` class for both the header and every set row.

---

## Future Considerations

- Add `incline` display to CARDIO history charts.
- Add pace calculation (min/km) derived from `durationSeconds` + `distanceKm`.
- Add `WEIGHT_REPS` volume breakdown by muscle group.
- Support weighted `REPS_ONLY` PRs (e.g. weighted pull-ups with a dip belt).
- Plan-builder UI should filter by `trackingType` when suggesting default sets.
