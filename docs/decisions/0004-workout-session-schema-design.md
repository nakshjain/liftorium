# ADR 0004: Workout Session Schema Design

## Status

Accepted

## Date

2026-05-10

## Context

Workout logging needs to be fast during active gym sessions and efficient when reading completed history. A workout contains session metadata, ordered exercises, and ordered sets with performance data.

The schema also needs room for future features such as supersets, dropsets, tempo tracking, and workout notes.

## Decision

Store each workout as a user-owned MongoDB document with embedded workout exercises and embedded sets.

Each embedded workout exercise references the exercise catalog by `exerciseId`. Set data is embedded because it represents immutable session performance history rather than shared catalog data.

Use fields that support future expansion:

- `supersetGroupId` on workout exercises for future superset grouping.
- `setType` on sets for `standard`, `warmup`, and `dropset`.
- `tempo` on sets for eccentric, pause, concentric, and top-pause tracking.
- `notes` on workouts, workout exercises, and sets.

## Consequences

Active workout updates and history reads are efficient because the full session is available in one document.

Catalog exercise details remain normalized through `exerciseId` references.

Future PR tracking and exercise history can query by `userId`, `exercises.exerciseId`, and `startedAt`.

Very large workouts could eventually approach document-size limits, but normal workout sessions are comfortably suited to embedded data.

## Alternatives Considered

- Separate collections for workout exercises and sets: more normalized, but slower and more complex for active logging and history reads.
- Store only denormalized exercise names: simpler reads, but loses a durable relation to the exercise catalog.
- Add separate superset documents immediately: more flexible, but premature for the MVP.
