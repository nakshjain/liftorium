---
description: Backend Java/Spring Boot coding conventions and patterns
globs: ["backend/**/*.java"]
---

# Backend Conventions

## Architecture
- Strict layering: Controller → Service → Repository. Never skip layers.
- Controllers inject `UserPrincipal` via `@AuthenticationPrincipal` for the authenticated user.
- All responses use the `ApiResponse` envelope: `{ "success": true/false, "data": {} }` or `{ "success": false, "error": { "code": "", "message": "" } }`.

## Java Style
- Java 21 features: use records for DTOs, text blocks, pattern matching where appropriate.
- Constructor injection only — no `@Autowired` field injection. Use `@RequiredArgsConstructor` from Lombok.
- Lombok only for boilerplate (getters, constructors, builders). No `@Data` on entities.
- Jakarta Validation annotations on all request DTOs — no manual null checks in service layer.

## MongoDB / Data
- Workout data model embeds everything: `Workout` → `WorkoutExercise[]` → `WorkoutSet[]`. No joins.
- Use `ObjectIdValidator.requireValid()` in controllers for path variable IDs.
- Repository layer uses Spring Data MongoDB. Custom queries go in `*QueryRepository`.

## Error Handling
- Centralized via `GlobalExceptionHandler` (`@RestControllerAdvice`).
- Throw `AppException` with error code, message, and HTTP status from services.

## Naming
- Package: `com.liftorium.*`
- DTOs grouped by feature in a single file (e.g., `WorkoutDtos.java` with inner records).
- Controllers: `*Controller`, Services: `*Service`, Repos: `*Repository`.
