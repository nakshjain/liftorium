# Prompt Log

Use this file to record important AI prompts and outcomes.

## Template

```md
## YYYY-MM-DD - Prompt Title

### Prompt

<Paste or summarize the prompt.>

### Context

<What part of the project this affected.>

### Outcome

<Files changed, decisions made, or implementation produced.>

### Follow-Up

<Any remaining tasks.>
```

## 2026-05-10 - Documentation Structure Scaffold

### Prompt

Create the complete project documentation structure with starter markdown files, architecture docs, API docs, AI workflow docs, progress tracker docs, and prompt history docs.

### Context

Initial project documentation setup for the Gym Helper application.

### Outcome

Created `/docs` documentation scaffold with architecture, API, workflow, prompt, progress, and decision templates.

### Follow-Up

Keep documentation updated as implementation begins.

## 2026-05-10 - Implement JWT Auth Module

### Prompt

Implement JWT auth module.

### Context

First MVP priority for Gym Helper. Backend directory required a production-ready Express/TypeScript foundation plus modular auth implementation.

### Outcome

Implemented backend JWT authentication with registration, login, refresh token rotation, current user lookup, logout, validation, centralized errors, MongoDB models, and environment configuration.

### Follow-Up

Add frontend authentication pages, route guards, backend auth tests, and rate limiting for auth endpoints.

## 2026-05-10 - Generate GitHub README

### Prompt

Generate a professional GitHub README for this project. Include project overview, architecture, AI-assisted workflow, tech stack, setup instructions, screenshots placeholders, roadmap, documentation structure, and scalability considerations.

### Context

Root README was still a placeholder while the project already had frontend scaffold, backend auth foundation, and structured documentation.

### Outcome

Created a complete GitHub README with current project status, setup commands, architecture overview, documentation links, roadmap, and scalability notes.

### Follow-Up

Replace screenshot placeholders after frontend UI screens are implemented.

## 2026-05-10 - Implement Exercise Database Module

### Prompt

Implement the Exercise Database module with modular architecture, strict TypeScript, MongoDB/Mongoose, controller/service/repository structure, validation, CRUD, pagination, search, filters, Mongo indexes, DTO typing, API docs, progress logs, and architecture decision documentation.

### Context

Exercise database is the third MVP priority and provides the catalog needed for workout tracking.

### Outcome

Implemented the backend exercise module with schema, repository, service, controller, routes, validation, DTOs, pagination, search, filters, and documentation updates.

### Follow-Up

Add exercise seed data, frontend exercise browsing/search UI, and integration tests.

## 2026-05-10 - Implement Workout Session Module

### Prompt

Implement the Workout Session module with start session, dynamic exercise addition, set add/remove, tracking for reps, weight, rest time, duration, RPE, warmups, finish workout, workout history, scalable schema design, optimized MongoDB relations, validation, error handling, REST APIs, DTO typing, documentation, API docs, progress tracking, and future support for supersets, dropsets, tempo tracking, and notes.

### Context

Workout tracking is the second MVP priority and depends on authenticated users and exercise catalog references.

### Outcome

Implemented the backend workout session module with authenticated user-owned sessions, embedded workout exercise/set data, catalog exercise references, session completion, history pagination, validation, and documentation updates.

### Follow-Up

Add frontend workout logging UI and backend integration tests.

## 2026-05-10 - Implement Angular Authentication Flow

### Prompt

Implement Angular authentication flow with login page, signup page, JWT storage, refresh token handling, route guards, HTTP interceptors, Tailwind dark UI, mobile-first design, Signals for auth state, modular architecture, reusable form components, validation, loading states, API service layer, and documentation updates.

### Context

Authentication backend was already implemented. The frontend needed a complete auth flow to support protected MVP screens.

### Outcome

Implemented Angular auth state, API integration, guards, interceptor, login/signup pages, reusable form field component, Tailwind setup, protected app placeholder, and documentation updates.

### Follow-Up

Add focused frontend auth tests and revisit access token storage hardening before production.

## 2026-05-10 - Implement Live Workout Logging UI

### Prompt

Implement live workout logging UI with mobile-first UX, minimal taps, dark gym aesthetic, instant add/remove sets, previous workout comparison, rest timer, sticky bottom controls, fast weight/reps editing, Signals-based state management, Tailwind styling, start workout, select exercises, log sets, mark completed sets, and finish workout.

### Context

Workout session backend and Angular auth flow already existed. The frontend needed the core MVP workout logging surface behind the authenticated app route.

### Outcome

Added a lazy-loaded live workout feature with a Signals store, seeded exercise/history data, thumb-friendly set controls, rest timer behavior, dashboard entry point, and documentation updates.

### Follow-Up

Connect the store to workout/exercise APIs, add persistence for active sessions, and add focused component/store tests.

## 2026-05-10 - Angular Component File Structure Refactor

### Prompt

Refactor the Angular frontend so every component uses a dedicated folder with separate `.ts`, `.html`, and `.scss` files. Remove inline templates/styles, preserve standalone components, Signals state, Tailwind styling, lazy loading, and strict TypeScript compliance. Update frontend architecture and prompt library documentation.

### Context

The frontend had several standalone components with inline templates. The project needed a consistent production-oriented component file standard across auth, dashboard, workout logging, shared form fields, and the root app component.

### Outcome

Moved all Angular components into dedicated folders, extracted templates/styles, updated route/import paths, kept SCSS files for every component, and documented the standard.

### Follow-Up

Apply the same structure to all future frontend components as features expand.

## 2026-05-10 - Migrate Backend To Spring Boot

### Prompt

Migrate the entire backend from Node.js and Express to Spring Boot latest using Java 21 and Maven. Preserve auth, exercise, and workout functionality, keep API compatibility where possible, use MongoDB, Spring Security, JWT authentication, Lombok, Spring Validation, layered architecture, environment-placeholder configuration, documentation updates, cleanup, and a final migration commit.

### Context

The existing backend used Express, TypeScript, Mongoose, JWT access tokens, refresh-token cookies, and controller/service/repository modules.

### Result

Rebuilt the backend as a Spring Boot 4.0.6 Maven project with Java 21, Spring Security JWT filtering, MongoDB entities/repositories, DTO validation, centralized exceptions, and equivalent auth, exercise, and workout API modules.
