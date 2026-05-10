# Architecture Overview

Gym Helper is a mobile-first workout tracking application with an Angular frontend, Spring Boot backend, and MongoDB database.

## System Shape

```text
User
  -> Angular Frontend
  -> Spring Boot REST API
  -> MongoDB
```

## Core Principles

- Mobile-first workout logging.
- Clean API contracts under `/api/v1`.
- Layered backend architecture with controllers, services, repositories, DTOs, and entities.
- JWT authentication with HTTP-only refresh-token cookies.
- Environment-driven configuration.
- Documentation and decisions updated alongside implementation work.

## Backend Runtime

The backend is a Java 21 Maven project using Spring Boot 4.0.6. `GymHelperApplication` starts the application, Spring Security protects routes, and Spring Data MongoDB persists users, refresh tokens, exercises, and workouts.

## Frontend Runtime

The frontend is an Angular application using standalone components, lazy routes, TypeScript, TailwindCSS, and Signals where appropriate.
