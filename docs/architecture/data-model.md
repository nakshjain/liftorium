# Data Model

This document tracks the planned MongoDB collections and relationships.

## Collections

| Collection | Purpose | MVP |
| --- | --- | --- |
| `users` | Account identity and profile data | Yes |
| `refresh_tokens` | Refresh token persistence and revocation | Yes |
| `exercises` | Exercise catalog | Yes |
| `workouts` | Active and completed workout sessions | Yes |
| `personal_records` | PR tracking | Later |

## User

```ts
type User = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};
```

## Refresh Token

```ts
type RefreshToken = {
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

```ts
type Exercise = {
  id: string;
  name: string;
  description: string;
  category: string;
  equipment: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
};
```

Exercise muscle fields support multi-muscle movements and catalog filtering.

## Workout

```ts
type Workout = {
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

```ts
type WorkoutExercise = {
  id: string;
  exerciseId: string;
  order: number;
  supersetGroupId?: string;
  notes?: string;
  sets: WorkoutSet[];
};
```

## Workout Set

```ts
type WorkoutSet = {
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
- `refresh_tokens.userId` should be indexed.
- `refresh_tokens.expiresAt` should support cleanup.
- `workouts.userId` and `workouts.startedAt` should be indexed for history views.
- `workouts.userId + status + startedAt` supports active-session lookup and session lists.
- `workouts.userId + finishedAt` supports completed history pagination.
- `workouts.userId + exercises.exerciseId + startedAt` supports future exercise history and PR analytics.
- `exercises.name` has a text index for name search.
- `exercises.category` and `exercises.equipment` are indexed for filters.
- `exercises.targetMuscles` and `exercises.secondaryMuscles` are indexed for muscle group filters.
- `exercises.category + equipment` and `exercises.targetMuscles + equipment` compound indexes support common catalog browsing queries.
