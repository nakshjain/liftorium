# Gym Helper Backend Schema Design

## Document Information

| Field        | Value                 |
| ------------ | --------------------- |
| Document     | Backend Schema Design |
| Product      | Gym Helper            |
| Version      | MVP v1                |
| Status       | Active                |
| Last Updated | June 2026             |

---

# 1. Purpose

This document defines the database schema design for Gym Helper.

The schema is optimized for:

* workout tracking performance
* progression analytics
* future extensibility
* rapid MVP development

MongoDB is used as the primary database.

---

# 2. Design Principles

## Data Ownership

Each collection should have a clear responsibility.

Avoid duplicated business data.

---

## Scalability

Schemas must support:

* millions of workout records
* future analytics
* progression calculations

---

## Query Efficiency

Optimize for:

* active workout retrieval
* workout history
* exercise progression
* analytics calculations

---

## Future Compatibility

Future support should not require major schema redesign.

Examples:

* supersets
* dropsets
* tempo tracking
* workout templates
* AI recommendations

---

# 3. Collection Overview

```text
users

exercises

workoutSessions

workoutTemplates

bodyMetrics

progressionLogs
```

---

# 4. Users Collection

## Purpose

Stores user account and profile information.

---

### Fields

```ts
{
  _id: ObjectId,

  email: string,

  passwordHash: string,

  firstName: string,

  lastName: string,

  profileImage?: string,

  role: "user" | "admin",

  isActive: boolean,

  lastLoginAt?: Date,

  createdAt: Date,

  updatedAt: Date
}
```

---

### Indexes

```ts
email (unique)
```

---

# 5. Exercises Collection

## Purpose

Stores exercise master data.

Exercises are shared across all users.

---

### Fields

```ts
{
  _id: ObjectId,

  name: string,

  normalizedName: string,

  slug: string,

  aliases: string[],

  primaryMuscles: string[],

  secondaryMuscles: string[],

  bodyParts: string[],

  equipment: string[],

  movementPattern: string,

  exerciseType: string,

  active: boolean,

  createdAt: Date,

  updatedAt: Date
}
```

Provider identifiers and sync timestamps are stored in `exercise_provider_mappings`. Instructions, descriptions, images, and videos are fetched from the active provider on demand.

---

### Indexes

```ts
slug (unique)

active + normalizedName + _id

active + searchPrefixes + normalizedName

active + primaryMuscles + normalizedName

active + equipment + normalizedName
```

See [Exercise Module Architecture](./architecture/exercise-module.md) for the authoritative Exercise schema, mapping collection, validation, and provider migration design.

---

# 6. Workout Sessions Collection

## Purpose

Stores completed workout sessions.

This is the most important collection.

---

### Structure

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  startedAt: Date,

  completedAt: Date,

  durationMinutes: number,

  notes?: string,

  exercises: WorkoutExercise[],

  totalVolume: number,

  createdAt: Date,

  updatedAt: Date
}
```

---

# 7. Workout Exercise Subdocument

Represents an exercise performed inside a workout.

```ts
{
  exerciseId: ObjectId,

  exerciseName: string,

  primaryMuscles: string[],

  equipment: string[],

  exerciseType: string,

  order: number,

  sets: WorkoutSet[]
}
```

---

# 8. Workout Set Subdocument

```ts
{
  setNumber: number,

  weight: number,

  reps: number,

  completed: boolean
}
```

---

### Example

```ts
{
  setNumber: 1,

  weight: 80,

  reps: 8,

  completed: true
}
```

---

### Indexes

```ts
userId

startedAt

completedAt

userId + completedAt
```

---

# 9. Workout Templates Collection

## Purpose

Stores reusable workout routines.

Future MVP+ feature.

---

### Fields

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  name: string,

  description?: string,

  exercises: TemplateExercise[],

  createdAt: Date,

  updatedAt: Date
}
```

---

# 10. Body Metrics Collection

## Purpose

Stores body measurements.

Future MVP+ feature.

---

### Fields

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  weight?: number,

  bodyFatPercentage?: number,

  chest?: number,

  waist?: number,

  arms?: number,

  thighs?: number,

  recordedAt: Date
}
```

---

### Indexes

```ts
userId

recordedAt
```

---

# 11. Progression Logs Collection

## Purpose

Stores calculated progression records.

Used for analytics optimization.

---

### Fields

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  exerciseId: ObjectId,

  exerciseName: string,

  currentPRWeight: number,

  currentPRReps: number,

  estimated1RM: number,

  totalVolume: number,

  lastPerformedAt: Date,

  updatedAt: Date
}
```

---

### Indexes

```ts
userId + exerciseId

userId

exerciseId
```

---

# 12. Collection Relationships

```text
User
│
├── Workout Sessions
│
├── Workout Templates
│
├── Body Metrics
│
└── Progression Logs


Workout Session
│
└── Exercises
     │
     └── Sets
```

---

# 13. MVP Data Model

Required Collections:

```text
users

exercises

workoutSessions
```

---

Optional Collections:

```text
progressionLogs
```

---

Deferred Collections:

```text
workoutTemplates

bodyMetrics
```

---

# 14. Analytics Strategy

For MVP:

Analytics calculated from workoutSessions.

---

Future Optimization:

Store aggregated analytics in:

```text
progressionLogs
```

to reduce expensive queries.

---

# 15. Soft Delete Strategy

Avoid physical deletion where possible.

Use:

```ts
isActive: boolean
```

for entities requiring recovery.

Workout history should never be physically deleted.

---

# 16. Auditing Fields

All collections must include:

```ts
createdAt

updatedAt
```

managed automatically by Mongoose timestamps.

---

# 17. Schema Constraints

Requirements:

* strict TypeScript interfaces
* Mongoose schema validation
* indexed query fields
* normalized exercise master data
* embedded workout sets

Avoid:

* deep document nesting
* unnecessary references
* duplicated workout data

---

# 18. MVP Schema Decisions

Approved Decisions:

* MongoDB
* Embedded workout sets
* Embedded workout exercises
* Shared exercise library
* User-owned workout sessions
* User-owned progression records

Deferred Decisions:

* Exercise media storage
* Supersets
* Dropsets
* Tempo tracking
* AI-generated workout plans

These features can be added later without major schema redesign.
