# Data Model

This document tracks the planned MongoDB collections and relationships.

## Collections

| Collection | Purpose | MVP |
| --- | --- | --- |
| `users` | Account identity and profile data | Yes |
| `refreshtokens` | Refresh token persistence and revocation | Yes |
| `exercises` | Exercise catalog | Yes |
| `exercise_provider_mappings` | Provider identity and sync state for exercises | Yes |
| `workouts` | Active and completed workout sessions | Yes |
| `personal_records` | PR tracking | Later |

## User

```java
class User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};
```

## Refresh Token

```java
class RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

Refresh token hashes are deterministic HMAC-SHA256 values derived from the raw token and refresh token secret. Raw refresh tokens must never be stored.

## Exercise

```java
class Exercise {
  id: string;
  name: string;
  normalizedName: string;
  slug: string;
  aliases: string[];
  searchPrefixes: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  movementPattern: MovementPattern;
  exerciseType: ExerciseType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Provider-owned instructions, descriptions, images, and video are fetched on demand and are not stored in this collection.

## Exercise Provider Mapping

```java
class ExerciseProviderMapping {
  id: string;
  provider: "ASCEND_API";
  providerExerciseId: string;
  exerciseId: string;
  providerDatasetVersion: string;
  providerName: string;
  contentFingerprint: string;
  active: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  lastSyncedAt: string;
  missingSince?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Workout

```java
class Workout {
  id: string;
  userId: string;
  name: string;
  status: "active" | "completed" | "discarded";
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};
```

## Workout Exercise

```java
class WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  equipment: string[];
  exerciseType: ExerciseType;
  order: number;
  supersetGroupId?: string;
  notes?: string;
  sets: WorkoutSet[];
};
```

## Workout Set

```java
class WorkoutSet {
  id: string;
  order: number;
  reps: number;
  weight: number;
  restTimeSeconds?: number;
  durationSeconds?: number;
  rpe?: number;
  isWarmup: boolean;
  setType: "standard" | "warmup" | "dropset";
  tempo?: {
    eccentric?: number;
    pauseBottom?: number;
    concentric?: number;
    pauseTop?: number;
  };
  notes?: string;
  completedAt?: string;
};
```

Workout exercises and sets are embedded inside the workout document for fast active-session updates and history reads. Each workout exercise references the catalog `exercises` collection by `exerciseId`.

## Indexing Notes

- `users.email` should be unique.
- `refreshtokens.userId` should be indexed.
- `refreshtokens.expiresAt` should support cleanup.
- `workouts.userId` and `workouts.startedAt` should be indexed for history views.
- `workouts.userId + status + startedAt` supports active-session lookup and session lists.
- `workouts.userId + finishedAt` supports completed history pagination.
- `workouts.userId + exercises.exerciseId + startedAt` supports future exercise history and PR analytics.
- `exercises.slug` is unique.
- `exercises.active + normalizedName + _id` supports cursor pagination.
- `exercises.active + searchPrefixes + normalizedName` supports indexed autocomplete.
- Separate compound indexes cover primary muscles, secondary muscles, equipment, and exercise type.
- `exercise_provider_mappings.provider + providerExerciseId` is unique.
- `exercise_provider_mappings.exerciseId + provider` is unique.
- No compound index combines muscles and equipment because both are arrays.
