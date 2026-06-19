# ADR-0010: Weight Unit Handling (kg / lb)

**Status:** Accepted  
**Date:** 2026-06-19

---

## Context

Users have different preferences for weight units (kilograms vs pounds). The app needs to support both while keeping analytics, PR tracking, and volume calculations consistent across all users.

---

## Decision

**Store all weights in kilograms.** The user's preferred unit is a display/input preference only — it never affects what is persisted in MongoDB.

---

## Consequences

### Positive

- All PR calculations, volume totals, and analytics queries work on a single consistent unit — no per-query conversion logic.
- Sorting and comparisons (e.g. "best set", "new PR") are always correct.
- Reporting and multi-user analytics are trivial.
- No risk of mixed-unit bugs in the database.

### Negative

- Frontend must convert on both input (lb → kg before save) and display (kg → lb for lb users).
- A unit preference change does not retroactively re-label old workout history (the stored values are always correct; only the label changes).

---

## Implementation

### Backend

No changes required. All `weight` fields in MongoDB are always kg.

### Frontend — conversion utility (`shared/utils/weight.utils.ts`)

| Function | Purpose |
|---|---|
| `lbToKg(lb)` | Convert lb → kg (2 decimal places) |
| `kgToLb(kg)` | Convert kg → lb (1 decimal place) |
| `toDisplayWeight(kg, unit)` | Convert stored kg to display value |
| `toStorageKg(display, unit)` | Convert display value to kg for API |
| `formatWeight(kg, unit)` | "100 kg" or "220.5 lb" |
| `formatWeightCompact(kg, unit)` | "100kg" or "220.5lb" (no space) |
| `weightStep(unit)` | 2.5 for kg, 5 for lb |
| `defaultWeight(unit)` | 20 for kg, 45 for lb (empty barbell) |

### Frontend — global settings store (`features/settings/settings.store.ts`)

- `providedIn: 'root'` singleton.
- On app start: reads `localStorage` → populates signals immediately (no loading flicker).
- On login: `AuthService.applySession()` calls `settingsStore.load()` → fetches latest from API → updates signals + `localStorage`.
- On logout: `AuthService.clearSession()` calls `settingsStore.clear()` → wipes signals + `localStorage`.
- `settingsStore.update(patch)` applies optimistically (signal + localStorage first, API second, rollback on error).

### Frontend — startup flow

```
App boots
    ↓
localStorage → signal store (immediate, no flicker)
    ↓
User logs in
    ↓
AuthService.applySession() → settingsStore.load()
    ↓
GET /api/v1/settings → settingsStore signals updated + localStorage refreshed
```

### Frontend — input flow (lb user entering 225)

```
User types 225 in weight input
    ↓
Stored in LiveWorkout.set.weight = 225  (display unit, in memory only)
    ↓
User finishes workout
    ↓
WorkoutService.save() calls toStorageKg(225, 'lb') = 102.06
    ↓
POST /workouts/:id/exercises/:eid/sets  { weight: 102.06 }
    ↓
MongoDB stores 102.06 (kg)
```

### Frontend — display flow (lb user viewing history)

```
GET /workouts/:id  → set.weight = 102.06 (kg from API)
    ↓
formatWeight(102.06, 'lb') = "225 lb"
    ↓
Displayed to user
```

### Components wired

| Component | Change |
|---|---|
| `live-workout-page` | Weight column header shows unit, stepper uses `weightStepSize()`, volume suffix uses `weightUnit()`, PR display uses `weightUnit()`, perf label uses `formatWeightCompact` |
| `workout-detail-page` | Column headers include unit, `formatWeight()` converts from kg, volume converts via `toDisplayWeight()` |
| `progress-page` | `formatWeight`, `formatRepPr`, `formatPrTransition` all unit-aware |
| `exercise-progression-page` | Chart tooltip, start/end labels, progression summary all unit-aware |
| `settings-page` | Saves through `UserSettingsStore.update()` for optimistic updates |
| `LiveWorkoutStore` | Default weight and step size are unit-aware |
| `WorkoutService.save()` | `toStorageKg()` called on every set before POST |

---

## Scope

MVP supports one global unit preference per user. Not supported (deferred):
- Per-workout unit override
- Per-exercise unit override
- Per-set unit override
