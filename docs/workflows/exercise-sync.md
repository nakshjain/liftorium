# Exercise Provider Sync Workflow

## First Import

1. Start a sync run and record `syncStartedAt`.
2. Read every AscendAPI page using its provider cursor.
3. Map provider data into canonical metadata.
4. Create an internal Exercise and provider mapping when `(provider, providerExerciseId)` is new.
5. Save only metadata used by search, workout references, and analytics.
6. Finish deletion detection only after every provider page succeeds.

## Incremental Sync

AscendAPI V2 does not currently document an `updatedSince` feed. Gym Helper therefore performs a complete provider ID scan but computes a metadata fingerprint:

- unchanged fingerprint: update mapping timestamps only
- changed fingerprint: update canonical metadata
- new provider ID: create mapping and internal exercise
- provider ID not seen in a completed run: deactivate mapping

This is write-incremental even though discovery is a full scan.

## Renames

Provider renames update `name` and `normalizedName`. The previous name is retained in `aliases` for search and historical discoverability. The existing internal ID and slug remain stable.

## Deletions

A missing provider record sets mapping `active=false` and `missingSince`. The internal exercise becomes inactive only when no active provider mappings remain. Workouts, templates, PRs, and analytics records are never deleted.

## Content Retrieval

Images, videos, overview, instructions, and tips are fetched only through:

```http
GET /api/v1/exercises/{id}?includeContent=true
```

Short-lived server or CDN-aware caching may be added later, but provider content is not permanent Exercise collection data.

## Provider Migration

1. Integrate the new provider behind `ExerciseProvider`.
2. Produce candidate mappings using normalized name, equipment, body parts, and muscles.
3. Review ambiguous candidates; never merge on name alone.
4. Link approved new provider mappings to existing internal exercise IDs.
5. Run both providers during a validation window.
6. Set `preferredForContent=true` on the new mapping and false on the old mapping.
7. Deactivate old mappings after parity checks.

Workout and analytics references require no migration because they use internal exercise IDs.

## Failure Rules

- Retry transient `429` and `5xx` responses with bounded exponential backoff when scheduling is added.
- Abort the run on an incomplete page sequence.
- Do not mark unseen mappings inactive after a failed or partial run.
- Record sync metrics: pages, created, updated, unchanged, deactivated, failures, duration.
- Run only one sync per provider at a time using a distributed lock when multiple backend instances are deployed.
