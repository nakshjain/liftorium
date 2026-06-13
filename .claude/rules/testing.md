---
description: Testing conventions and quality requirements
globs: ["**/*.spec.ts", "**/*.test.ts", "**/src/test/**/*.java"]
---

# Testing

## General Principles

* Test behavior, not implementation details.
* Cover the primary success path before edge cases.
* Prefer focused, maintainable tests over excessive coverage.
* Bug fixes should include a regression test when practical.

## What NOT to Test

* Trivial getters/setters with no logic.
* Simple delegations that just forward to another method.
* Framework-provided behavior (Spring Data derived queries, Angular DI wiring).
* Auto-generated code or boilerplate.

## Frontend Testing

* Framework: Vitest.
* Test files colocated with source code using `*.spec.ts`.
* Test user-visible behavior rather than internal implementation.
* Focus tests on:

    * Component behavior
    * Form validation
    * Stores and state management
    * Authentication flows
    * Critical user journeys

## Backend Testing

* Framework: JUnit 5 + Spring Boot Test.
* Tests reside under `src/test/java/` mirroring production package structure.
* Use:

    * `@SpringBootTest` for integration tests
    * `@WebMvcTest` for controller tests
    * Mockito for isolated unit tests
* Focus tests on:

    * Business logic
    * Validation
    * Exception handling
    * Security-sensitive flows
    * Custom repository queries

## Test Execution

Frontend:

```bash
cd frontend && npm test
```

Backend:

```bash
cd backend && mvn test
```

## Quality Gates

Before considering work complete:

* Code compiles successfully.
* New tests pass.
* Existing tests continue to pass.
* No failing tests are ignored or disabled.

## AI Agent Rules

* Never claim tests passed unless they were actually executed.
* If tests were not run, explicitly state that.
* Do not remove or weaken tests to make a build pass.
* If test coverage is not added, explain why.
* Prefer fixing the root cause over changing test expectations.
