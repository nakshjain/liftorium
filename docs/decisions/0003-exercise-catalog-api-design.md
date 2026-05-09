# ADR 0003: Exercise Catalog API Design

## Status

Accepted

## Date

2026-05-10

## Context

The exercise database is a core dependency for workout tracking. Users need fast catalog browsing, filtering, and search while logging workouts. The backend also needs a clean foundation for future seeded exercises, custom exercises, and admin controls.

## Decision

Implement exercises as a dedicated backend module using controller/service/repository separation.

Use the requested schema fields:

- `name`
- `description`
- `category`
- `equipment`
- `targetMuscles`
- `secondaryMuscles`
- `instructions`
- `tips`
- `mediaUrl`

Expose public read endpoints for listing and retrieving exercises. Require authentication for create, update, and delete operations until role-based administration or custom exercise ownership is introduced.

Use a MongoDB text index on `name`, field indexes for filters, and compound indexes for common catalog browsing patterns.

## Consequences

Catalog browsing can be fast and available before login-specific workout flows are complete.

Mutation endpoints are protected, preventing anonymous writes.

The module can evolve toward admin-managed global exercises or user-owned custom exercises without changing the public read contract.

Text search is currently limited to exercise names, which matches the MVP requirement and keeps search behavior predictable.

## Alternatives Considered

- Require authentication for all exercise endpoints: secure but adds friction for public catalog browsing.
- Allow anonymous mutations: simpler for early testing but not production-safe.
- Use regex-only search: easy to implement but less aligned with indexed MongoDB search.
- Add ownership fields immediately: useful later for custom exercises, but not required by the requested schema.
