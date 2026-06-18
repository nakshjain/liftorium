# Architecture: User Settings

## Design decision — separate collection

Settings are stored in a dedicated `user_settings` collection rather than embedded in the `users` document. The reasons:

- **Single-responsibility** — the `users` collection owns identity (email, password hash, roles). Settings are a separate concern.
- **Independent evolution** — new settings fields can be added without touching user schema migrations.
- **Scalability** — settings documents can grow independently (e.g. large preference trees) without bloating auth queries.
- **Partial reads** — callers that only need `users` (e.g. JWT validation, auth checks) are not burdened by settings payload.

The one-to-one relationship is enforced by a unique index on `userId`.

---

## Layer structure

```
UserSettingsController   ← validates input, delegates to service, returns ApiResponse<T>
        │
UserSettingsService      ← business logic, entity↔DTO mapping, password policy, account deletion
        │
UserSettingsRepository   ← MongoRepository, three query methods
        │
user_settings collection (MongoDB)
```

This mirrors the controller/service/repository pattern used everywhere else in the project.

---

## Default settings on registration

`AuthService` calls `userSettingsRepository.save(UserSettings.createDefaults(userId))` immediately after `userRepository.save(user)` in both registration paths:

- `verifyRegistration()` — OTP two-step flow
- `register()` — direct registration flow

This guarantees every user always has a settings document; the `getOrCreate` guard in `UserSettingsService` is a safety net for legacy accounts and is not the primary creation path.

---

## Frontend signal integration

After a display name update, `SettingsService.updateAccount()` calls `authService.patchUser(user)` in a `tap()` operator. This merges the new display name into the in-memory `userSignal` so the nav bar avatar initial and the greeting on the dashboard update immediately without requiring a page reload or a separate `/auth/me` call.

---

## Frontend architecture

```
/features/settings/
  settings.models.ts        — pure TypeScript types, no Angular deps
  settings.service.ts       — HttpClient calls, injectable
  settings-page/
    settings-page.ts        — standalone component, OnInit, Signals + class fields
    settings-page.html      — 5 tab sections: Account / Workout / Appearance / Security / Data
```

The page uses a single `activeSection` signal to toggle between the five sections in the same component rather than child-routing. This keeps the implementation minimal for the MVP and avoids the overhead of nested routes for a settings area that loads a small amount of data once.

---

## Security considerations

- All `/api/v1/settings/**` routes are protected by `anyRequest().authenticated()` in `SecurityConfig` — no extra configuration needed.
- The `changePassword` operation re-verifies the current password before applying the change, defending against session-hijacking scenarios.
- The `deleteAccount` endpoint is destructive and irreversible. The frontend requires the user to type `DELETE` in all caps before the button is enabled, making accidental deletion impractical.
- Password fields use `type="password"` by default with optional show/hide toggles that require an explicit user action.

---

## Extensibility roadmap

Future settings sections can be added by:

1. Adding a new nested static inner class to `UserSettings` entity.
2. Adding corresponding DTO records to `UserSettingsDtos`.
3. Adding the new section's fields to `UpdateSettingsRequest` (null-safe, non-breaking).
4. Adding the new section to the frontend models and settings page tabs.

Suggested future sections: `notifications`, `dashboard`, `analytics`.
