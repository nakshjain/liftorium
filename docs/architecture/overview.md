# System Architecture Overview

## Summary

Gym Helper is a full-stack workout tracking application optimized for fast mobile use during real gym sessions.

The application is split into:

- Angular frontend for mobile-first user interaction.
- Node.js and Express backend for API orchestration.
- MongoDB database for persistent user, exercise, workout, and progress data.

## System Context

```text
User
  -> Angular Web App
  -> Express REST API
  -> MongoDB
```

## Core Domains

| Domain | Responsibility |
| --- | --- |
| Authentication | Registration, login, refresh tokens, logout, current user |
| Exercises | Exercise catalog, muscle groups, equipment, movement metadata |
| Workouts | Active workout sessions, exercise entries, sets, notes, completion |
| History | Completed workout browsing and filtering |
| Progress | Volume, estimated maxes, trends, personal records |

## Architectural Principles

- Keep domain logic out of route handlers.
- Use service classes for business rules.
- Use repository classes for persistence access.
- Validate all incoming requests before controller execution.
- Return consistent API response and error shapes.
- Keep frontend components focused on presentation and interaction.
- Use Angular Signals for local reactive state where appropriate.

## Initial MVP Scope

The first production-ready slice should include:

- User registration and login.
- Access and refresh token flow.
- Protected route support.
- Basic workout creation and completion.
- Exercise selection from a database-backed catalog.
