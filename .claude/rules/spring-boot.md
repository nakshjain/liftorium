---
description: Spring Boot backend conventions and architecture
globs: ["backend/**/*.java"]
---

# Spring Boot Conventions

## Architecture

* Follow Controller → Service → Repository architecture.
* Controllers handle request validation, authentication context extraction, and response mapping only.
* Services contain all business logic.
* Repositories contain data access logic only.
* Inject authenticated users via `@AuthenticationPrincipal UserPrincipal`.

## API Standards

* All API responses must use the `ApiResponse` envelope (see `api-design` rule for full contract).

## Java Style

* Target Java 21.
* Use records for DTOs.
* Use text blocks and pattern matching where they improve readability.
* Use constructor injection only.
* Never use field injection (`@Autowired`).
* Use Lombok only for boilerplate (`@Getter`, `@Builder`, `@RequiredArgsConstructor`, etc.).
* Never use Lombok `@Data` on entities.
* Apply Jakarta Validation annotations on all request DTOs.
* Prefer validation annotations over manual validation logic.

## MongoDB

* Workout model embeds related data:

    * Workout

        * WorkoutExercise[]

            * WorkoutSet[]
* Avoid joins and relational modeling patterns.
* Use Spring Data MongoDB repositories.
* Place custom query implementations in `*QueryRepository`.
* Validate path variable IDs using `ObjectIdValidator.requireValid()`.

## Error Handling

* Handle exceptions centrally via `GlobalExceptionHandler` (`@RestControllerAdvice`).
* Throw `AppException` from services with:

    * error code
    * message
    * HTTP status
* Do not return error responses directly from services.

## Naming

* Base package: `com.liftorium.*`
* Controllers: `*Controller`
* Services: `*Service`
* Repositories: `*Repository`
* Query repositories: `*QueryRepository`
* Group DTOs by feature (e.g., `WorkoutDtos.java`).

## Maintainability

* Reuse existing services before creating new ones.
* Follow existing project patterns before introducing new abstractions.
* Prefer consistency over personal preference.
