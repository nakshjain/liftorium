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
