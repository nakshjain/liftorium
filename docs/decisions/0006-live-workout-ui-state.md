# 0006 Live Workout UI State

## Status

Accepted

## Context

The MVP needs a workout logging surface that feels fast during an active gym session. Users need to start a session, add exercises, enter sets, compare against previous work, complete sets, manage rest, and finish without moving through heavy navigation.

## Decision

Use a feature-level Angular Signals store for live workout state and keep the first UI implementation local to the frontend route.

The live logger stores:

- Active workout metadata.
- Selected workout exercises.
- Set values and completion state.
- Previous workout comparison values.
- Rest timer timestamps.

The store is shaped around backend workout and exercise DTO concepts so API integration can replace seeded local data without a large UI rewrite.

## Consequences

- The UI is responsive and does not wait on network persistence for every tap.
- The route can be built and tested before the final API wiring is added.
- A backend update-set endpoint or client autosave strategy is still needed for durable fast edits.
- Future API integration should preserve optimistic local updates and reconcile server responses after mutations.
