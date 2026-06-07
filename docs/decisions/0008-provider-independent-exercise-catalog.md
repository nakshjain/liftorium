# ADR 0008: Provider-Independent Exercise Catalog

## Status

Accepted

## Date

2026-06-05

## Context

The existing Exercise module stored descriptions, instructions, tips, and media URLs directly in the catalog and had no provider identity model. AscendAPI is the initial source, but the application must preserve internal IDs and workout history if providers change.

## Decision

Store canonical searchable metadata in `exercises` and provider identity/sync state in `exercise_provider_mappings`.

Use an `ExerciseProvider` strategy implemented initially by `AscendApiService`.

Fetch rich provider content on demand. Use cursor pagination and precomputed search prefixes for the MVP catalog API. Use soft deactivation for provider removals.

Snapshot name and limited classification fields in workout exercises while retaining the internal exercise ID as the analytics identity.

## Consequences

Provider migrations do not rewrite workout records.

Multiple providers can coexist without polluting the Exercise domain schema.

Rich detail views depend on provider availability unless a compliant transient cache is added.

Search prefixes increase each Exercise document slightly but avoid unindexed regex for the MVP.

## Supersedes

This decision supersedes the schema, mutation, search, and media-storage portions of ADR 0003. ADR 0003 remains historical documentation of the first implementation.
