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
};
```

## Exercise

```ts
type Exercise = {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: string;
  movementPattern: string;
  isCustom: boolean;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Workout

```ts
type Workout = {
  id: string;
  userId: string;
  name: string;
  status: "active" | "completed" | "discarded";
  startedAt: string;
  completedAt?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Workout Exercise

```ts
type WorkoutExercise = {
  exerciseId: string;
  order: number;
  notes?: string;
  sets: WorkoutSet[];
};
```

## Workout Set

```ts
type WorkoutSet = {
  order: number;
  weight: number;
  reps: number;
  isWarmup: boolean;
  completedAt?: string;
};
```

## Indexing Notes

- `users.email` should be unique.
- `refresh_tokens.userId` should be indexed.
- `refresh_tokens.expiresAt` should support cleanup.
- `workouts.userId` and `workouts.startedAt` should be indexed for history views.
- `exercises.name` should be indexed for search.
