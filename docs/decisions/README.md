# Architecture Decision Records

This section stores architecture decision records.

## Documents

| Document | Purpose |
| --- | --- |
| [ADR Template](./adr-template.md) | Template for new decision records |
| [0001 Documentation Structure](./0001-documentation-structure.md) | Decision to maintain structured project documentation |
| [0002 JWT Refresh Token Strategy](./0002-jwt-refresh-token-strategy.md) | Decision for access tokens, refresh cookies, hashing, and rotation |
| [0003 Exercise Catalog API Design](./0003-exercise-catalog-api-design.md) | Decision for exercise schema, public reads, authenticated mutations, and indexed search |
| [0004 Workout Session Schema Design](./0004-workout-session-schema-design.md) | Decision for embedded workout sessions, catalog exercise references, and future set metadata |
| [0005 Angular Auth Flow Design](./0005-angular-auth-flow-design.md) | Decision for frontend Signals auth state, interceptors, guards, and token storage |
| [0006 Live Workout UI State](./0006-live-workout-ui-state.md) | Decision for local Signals state, mobile logging UX, and API-ready session shape |
| [0007 Spring Boot Backend Migration](./0007-spring-boot-backend-migration.md) | Decision to migrate backend from Express/TypeScript to Spring Boot, Java 21, and Maven |
| [0008 Provider-Independent Exercise Catalog](./0008-provider-independent-exercise-catalog.md) | Decision for canonical exercises, separate provider mappings, on-demand content, and provider migration |
| [0009 Resend Transactional Email](./0009-resend-transactional-email.md) | Decision to use Resend's Email API for OTP and password reset email delivery |

## ADR Naming

Use this format:

```text
0001-short-decision-title.md
0002-another-decision.md
```

## When To Create An ADR

Create an ADR when a decision:

- Affects project architecture.
- Changes data modeling.
- Changes authentication or security behavior.
- Introduces a major dependency.
- Establishes a long-lived convention.
