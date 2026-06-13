---
description: Testing conventions for backend and frontend
globs: ["**/*.spec.ts", "**/*.test.ts", "**/src/test/**/*.java"]
---

# Testing

## Frontend
- Test framework: Vitest.
- Test files colocated with source: `*.spec.ts`.
- Test component behavior, not implementation details.

## Backend
- Test framework: JUnit 5 + Spring Boot Test.
- Tests under `src/test/java/` mirroring main package structure.
- Use `@SpringBootTest` for integration tests, `@WebMvcTest` for controller-only tests.

## General
- Run frontend tests: `cd frontend && npm test`
- Run backend tests: `cd backend && mvn test`
- Test the golden path first, then edge cases.