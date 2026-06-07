# Exercises API

Base path:

```text
/api/v1/exercises
```

Exercise reads return Gym Helper exercise IDs and canonical metadata. Provider IDs are never exposed as domain identifiers.

## Exercise Response

```json
{
  "id": "665f...",
  "name": "Incline Dumbbell Press",
  "slug": "incline-dumbbell-press-tsxtj3",
  "aliases": [],
  "primaryMuscles": ["pectoralis major clavicular head"],
  "secondaryMuscles": ["anterior deltoid", "triceps brachii"],
  "bodyParts": ["chest"],
  "equipment": ["dumbbell", "bench"],
  "movementPattern": "HORIZONTAL_PUSH",
  "exerciseType": "STRENGTH",
  "active": true,
  "content": null,
  "createdAt": "2026-06-05T12:00:00Z",
  "updatedAt": "2026-06-05T12:00:00Z"
}
```

`content` is transient. It is fetched from the active provider only when explicitly requested and is not persisted in `exercises`.

## List Exercises

```http
GET /api/v1/exercises?limit=25&cursor=...&muscle=chest&equipment=dumbbell&exerciseType=STRENGTH
```

| Parameter | Type | Rules |
| --- | --- | --- |
| `limit` | integer | Default `25`, range `1..100` |
| `cursor` | string | Opaque cursor from the previous response |
| `muscle` | string | Canonical primary or secondary muscle code |
| `equipment` | string | Canonical equipment code |
| `exerciseType` | enum | `STRENGTH`, `CARDIO`, `STRETCHING`, `MOBILITY`, `BALANCE`, `PLYOMETRICS`, `REHABILITATION`, `OTHER` |
| `movementPattern` | enum | See Exercise Module architecture document |

```json
{
  "success": true,
  "data": {
    "items": [],
    "nextCursor": "opaque-value",
    "hasNext": true
  }
}
```

Catalog pagination is cursor-based and sorted by `normalizedName`, then `_id`. Numbered page navigation is intentionally unsupported.

## Search And Autocomplete

```http
GET /api/v1/exercises/search?q=incline+d&limit=10&muscle=chest&equipment=dumbbell
```

| Parameter | Type | Rules |
| --- | --- | --- |
| `q` | string | Required, trimmed, `2..120` characters |
| `limit` | integer | Default `10`, range `1..25` |
| `muscle` | string | Optional canonical muscle code |
| `equipment` | string | Optional canonical equipment code |

The MVP implementation uses precomputed lowercase prefixes from names and aliases. This supports indexed autocomplete without an unbounded case-insensitive regex.

For fuzzy matching, typo tolerance, ranking, or multilingual search, replace the repository implementation with MongoDB Atlas Search while preserving this API contract.

## Get Exercise

```http
GET /api/v1/exercises/{exerciseId}
```

Returns stored metadata only.

```http
GET /api/v1/exercises/{exerciseId}?includeContent=true
```

Also fetches provider content on demand:

```json
{
  "content": {
    "provider": "ASCEND_API",
    "overview": "Provider-owned overview.",
    "instructions": ["Step one."],
    "tips": ["Form cue."],
    "imageUrls": {
      "360p": "https://provider-cdn.example/image.webp"
    },
    "videoUrl": "https://provider-cdn.example/video.mp4"
  }
}
```

Provider failures return `502 EXERCISE_PROVIDER_ERROR`. Missing active mappings return `503 EXERCISE_CONTENT_UNAVAILABLE`.

## Removed Catalog Mutations

Public `POST`, `PATCH`, and `DELETE` exercise endpoints are not part of the provider-managed catalog. Imports and updates occur through the sync service. Provider removals use soft deactivation.
