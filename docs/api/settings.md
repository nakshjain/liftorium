# Settings API

Base path: `/api/v1/settings`  
All endpoints require a valid `Authorization: Bearer <access_token>` header.

---

## GET /api/v1/settings

Returns the authenticated user's settings. If no settings document exists yet (e.g. legacy account), defaults are created and returned transparently.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "settings": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "userId": "665e0000000000000000001a",
      "units": {
        "weight": "kg",
        "distance": "km"
      },
      "workout": {
        "defaultRestSeconds": 90,
        "autoStartRestTimer": true
      },
      "appearance": {
        "theme": "dark"
      }
    }
  }
}
```

---

## PUT /api/v1/settings

Replaces all three settings sections atomically. All sections are required in the request body. Partial section updates are not supported on this endpoint — use section-specific endpoints for that (future roadmap).

### Request body

```json
{
  "units": {
    "weight": "lb",
    "distance": "mi"
  },
  "workout": {
    "defaultRestSeconds": 120,
    "autoStartRestTimer": false
  },
  "appearance": {
    "theme": "system"
  }
}
```

### Validation rules

| Field | Rules |
|---|---|
| `units.weight` | Required. One of: `kg`, `lb` |
| `units.distance` | Required. One of: `km`, `mi` |
| `workout.defaultRestSeconds` | Required. Integer `0–600` |
| `workout.autoStartRestTimer` | Required. Boolean |
| `appearance.theme` | Required. One of: `dark`, `system` |

### Response `200 OK`

Same shape as GET response.

---

## PUT /api/v1/settings/account

Updates the user's display name. The user's email address is immutable and cannot be changed here.

### Request body

```json
{
  "displayName": "Alex Johnson"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `displayName` | Required. 1–80 characters |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665e0000000000000000001a",
      "email": "alex@example.com",
      "displayName": "Alex Johnson"
    }
  }
}
```

---

## PUT /api/v1/settings/security/password

Changes the authenticated user's password. Verifies the current password before applying the change.

### Request body

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `currentPassword` | Required |
| `newPassword` | Required. 8–128 characters. Must differ from current |

### Response `204 No Content`

Empty body on success.

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 422 | Current password is wrong |
| `PASSWORD_SAME_AS_CURRENT` | 422 | New password is identical to current |

---

## DELETE /api/v1/settings/account

Permanently deletes the user's account and all associated data (settings, workouts, progress records). This action is irreversible.

### Response `204 No Content`

Empty body on success. The client must clear the local session.

---

## MongoDB collection

Collection name: `user_settings`

### Schema

```
{
  _id:        ObjectId          — auto-generated
  userId:     ObjectId (unique) — references users._id
  units: {
    weight:   String            — "kg" | "lb"
    distance: String            — "km" | "mi"
  }
  workout: {
    defaultRestSeconds:  Int    — 0–600
    autoStartRestTimer:  Bool
  }
  appearance: {
    theme:    String            — "dark" | "system"
  }
  createdAt:  ISODate
  updatedAt:  ISODate
}
```

### Indexes

```
{ userId: 1 }  unique: true
```

---

## Extensibility

The schema is intentionally flat per section so future additions are non-breaking field additions within an existing section, or new top-level sections (e.g. `notifications`, `dashboard`, `analytics`). The `UpdateSettingsRequest` on the backend accepts `null` sections gracefully, so partial-section PUT requests can be supported in a future version without a breaking change.
