# Exercise Module Architecture

## Scope

This design covers the shared Exercise catalog, provider mappings, search, provider content retrieval, synchronization, and references from workout records. It does not change the finalized authentication, workout ownership, analytics, or collection boundaries.

## Final Exercise Schema

```javascript
{
  _id: ObjectId,
  name: String,
  normalizedName: String,
  slug: String,
  aliases: [String],
  searchPrefixes: [String],
  primaryMuscles: [String],
  secondaryMuscles: [String],
  bodyParts: [String],
  equipment: [String],
  movementPattern: String,
  exerciseType: String,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Changes from the suggested schema:

- Provider fields do not belong in `exercises`; they are mapping-specific.
- `lastSyncedAt` does not belong in `exercises`; each provider mapping syncs independently.
- `normalizedName`, `aliases`, and `searchPrefixes` support deterministic indexed search.
- `bodyParts` is retained because it is useful catalog metadata and coarser than anatomical muscles.
- Instructions, descriptions, images, videos, tips, provider keywords, and related provider IDs are not stored.
- `slug` is unique but is not an identity. Internal ObjectId is the permanent reference.

`primaryMuscles`, `secondaryMuscles`, `bodyParts`, and `equipment` are canonical lowercase taxonomy codes. They are controlled vocabularies, not provider strings passed through unchanged. Unknown provider values must be mapped, quarantined, or explicitly represented as `other`; they must not silently create inconsistent filter values.

## Enums

`exerciseType`:

```text
STRENGTH
CARDIO
STRETCHING
MOBILITY
BALANCE
PLYOMETRICS
REHABILITATION
OTHER
```

`movementPattern`:

```text
HORIZONTAL_PUSH
HORIZONTAL_PULL
VERTICAL_PUSH
VERTICAL_PULL
SQUAT
HINGE
LUNGE
CARRY
ROTATION
ANTI_ROTATION
FLEXION
EXTENSION
LOCOMOTION
ISOMETRIC
OTHER
UNKNOWN
```

AscendAPI V2 does not currently provide a production-ready movement pattern field. Imports therefore use `UNKNOWN` until Gym Helper owns a reviewed classification rule or the provider supplies a stable field.

## Provider Mapping Schema

Use a separate collection:

```javascript
{
  _id: ObjectId,
  provider: "ASCEND_API",
  providerExerciseId: String,
  exerciseId: ObjectId,
  providerDatasetVersion: String,
  providerName: String,
  contentFingerprint: String,
  active: Boolean,
  preferredForContent: Boolean,
  firstSeenAt: Date,
  lastSeenAt: Date,
  lastSyncedAt: Date,
  missingSince: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

Separate mappings are required because one internal exercise may have mappings to several providers during migration, and provider sync state has a different lifecycle from exercise metadata. Embedding mappings would make provider-specific uniqueness, tombstoning, and migrations harder.

Duplicate controls:

- Unique `(provider, providerExerciseId)` prevents duplicate imports from one provider.
- Unique `(exerciseId, provider)` permits at most one mapping per provider for an internal exercise.
- Cross-provider matches are not auto-merged by name. Name collisions are common and unsafe.
- Provider migration uses a reviewed mapping manifest or exact canonical match process before linking a new mapping to an existing `exerciseId`.

## Validation Rules

Exercise:

- `name`: required, trimmed, `1..160`.
- `normalizedName`: required, lowercase normalized form of `name`, `1..160`.
- `slug`: required, lowercase URL-safe, `1..190`, unique.
- `aliases`: at most `20`, each `1..160`, unique after normalization.
- `searchPrefixes`: generated only by the application; clients cannot write it.
- taxonomy arrays: no nulls, blanks, or duplicates; each value at most `100`; maximum `30` items.
- `movementPattern` and `exerciseType`: required enum values.
- `active`: required boolean; default `true`.
- timestamps: server-managed UTC dates.

Provider mapping:

- provider and provider exercise ID are required.
- `providerExerciseId`: `1..200`.
- `exerciseId`: required valid ObjectId.
- fingerprint: lowercase SHA-256 hex.
- `lastSeenAt` and `lastSyncedAt`: required after a successful import.
- provider deletion never deletes the internal exercise or workout history.

Database JSON Schema validation should mirror these rules in production. Jakarta Validation protects API input, while sync mappers enforce provider input.

## MongoDB Indexes

```javascript
db.exercises.createIndex(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: "string" } } }
)
db.exercises.createIndex({ active: 1, normalizedName: 1, _id: 1 })
db.exercises.createIndex({ active: 1, searchPrefixes: 1, normalizedName: 1 })
db.exercises.createIndex({ active: 1, primaryMuscles: 1, normalizedName: 1 })
db.exercises.createIndex({ active: 1, secondaryMuscles: 1, normalizedName: 1 })
db.exercises.createIndex({ active: 1, equipment: 1, normalizedName: 1 })
db.exercises.createIndex({ active: 1, exerciseType: 1, normalizedName: 1 })

db.exercise_provider_mappings.createIndex(
  { provider: 1, providerExerciseId: 1 },
  { unique: true }
)
db.exercise_provider_mappings.createIndex(
  { exerciseId: 1, provider: 1 },
  { unique: true }
)
db.exercise_provider_mappings.createIndex(
  { provider: 1, active: 1, lastSeenAt: 1 }
)
```

Do not create a compound index containing both `primaryMuscles` and `equipment`: both are arrays, so it would be an invalid parallel-array multikey index. Keep one array field per compound index.

A plain MongoDB text index is not the primary recommendation. It does not provide good autocomplete and complicates deterministic filtered pagination. Use prefix tokens for MVP and Atlas Search when fuzzy search is required.

## Integration Architecture

```text
ExerciseController
  -> ExerciseService
      -> ExerciseRepository
      -> ExerciseProviderMappingRepository
      -> ExerciseProviderRegistry
          -> ExerciseProvider
              -> AscendApiService
                  -> AscendApiClient
                  -> AscendApiMapper
```

- `AscendApiClient`: HTTP, RapidAPI headers, endpoint paths, transport errors, provider response DTOs.
- `AscendApiService`: implements `ExerciseProvider`, validates envelopes, exposes provider-neutral pages/content.
- `AscendApiMapper`: maps provider taxonomy into canonical Gym Helper metadata and computes fingerprints.
- `ExerciseProvider`: strategy interface used by sync and on-demand content retrieval.
- `ExerciseProviderRegistry`: resolves a provider implementation without provider-specific branching in domain services.

Adding a provider requires a new client, mapper, and `ExerciseProvider` implementation. Controllers, workout logic, and the Exercise schema remain unchanged.

## Workout Integration

All modules reference `exercises._id`, never a provider ID.

Workout templates store:

- `exerciseId`
- ordering and template-specific prescription fields
- optional current display name only if the finalized template schema already snapshots names

Workout sessions snapshot:

- `exerciseId`
- `exerciseName`
- `primaryMuscles`
- `equipment`
- `exerciseType`

The snapshot preserves historical display and classification after provider renames or taxonomy corrections. It must not include instructions, media URLs, aliases, provider IDs, or sync metadata.

Personal records and progression aggregates use `(userId, exerciseId)` as identity. Analytics may use the workout snapshot for “as performed” historical grouping and the current Exercise record for current catalog grouping.

## Scalability

At 10,000 to 20,000 exercises, the catalog and mapping collections are small. Indexed cursor reads remain inexpensive. Avoid offset pagination and unanchored regex.

With multiple providers, mapping count grows linearly while the canonical catalog remains stable. Keep provider payloads out of MongoDB to avoid storage churn and licensing ambiguity.

With millions of workouts:

- Never join provider mappings during workout or analytics queries.
- Keep internal `exerciseId` in embedded workout exercises.
- Retain the existing workout index on user, embedded exercise ID, and workout date.
- Build asynchronous progression aggregates when raw workout scans become expensive.
- Do not cascade provider deletion into workout records.

## AscendAPI Assumptions

The initial adapter targets ExerciseDB V2 through RapidAPI. As of March 2026, the provider documents 11,000+ exercises, cursor pagination, `exerciseId`, muscles, body parts, equipment, exercise type, images, video, overview, instructions, and tips.

References:

- https://docs.ascendapi.com/products/edb-v2/overview
- https://docs.ascendapi.com/guides/pagination
- https://docs.ascendapi.com/quickstart/overview
