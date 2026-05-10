# ADR 0007: Spring Boot Backend Migration

## Status

Accepted

## Context

The MVP backend started as an Express and TypeScript service. The project now needs a backend foundation with stronger long-term maintainability, Spring Security integration, Java 21 support, and Maven-based builds while preserving the existing API contracts.

## Decision

Migrate the backend to Spring Boot 4.0.6 with Java 21 and Maven.

The backend uses:

- Spring Web for REST controllers.
- Spring Data MongoDB for persistence.
- Spring Security for route protection and authentication.
- JJWT for access and refresh token signing.
- Lombok to reduce boilerplate.
- Jakarta Validation for DTO validation.

The package structure is rooted at `com.gymhelper` with controller, service, repository, DTO, entity, security, config, exception, and utility layers.

## Consequences

- Backend commands now use Maven instead of npm.
- Runtime configuration is centralized in `application.properties` with environment variable placeholders.
- API response envelopes and endpoint paths remain compatible where possible.
- Spring Security gives the app a cleaner path to role-based authorization.
- Existing MongoDB collection names are preserved for users, refresh tokens, exercises, and workouts.
