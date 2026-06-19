# Architecture Documentation

> Navigation hub for all Liftorium architecture documents.
> Start here if you are new to the codebase.

---

## Recommended Reading Order

Follow this sequence to build a complete mental model of the system, from high-level to implementation detail.

```
1. overview.md              What the system is and how the pieces connect
2. system-architecture.md   Full component diagram — every service, repository, and collection
3. frontend.md              Angular stores, offline model, routing, auth, component structure
4. backend.md               Spring Boot packages, layering, all services and repositories
5. security.md              JWT model, token spec, OTP, BCrypt, known tradeoffs
6. data-model.md            All 11 MongoDB collections with field lists and indexes
7. auth-flow.md             Sequence diagrams for all five auth flows
8. backend-components.md    Class-level package diagram and request lifecycle
```

Specialist documents can be read independently once you have the overview:

```
TRACKING_TYPES.md           TrackingType enum, set fields, PR analytics, migration guide
user-settings.md            UserSettings collection design and frontend integration
architecture-review.md      Risks, scalability concerns, refactor recommendations
deployment.md               Environment variables, build, profiles, deployment checklist
```

---

## Document Index

### Foundation

| Document | Purpose |
|---|---|
| [Overview](./overview.md) | Executive summary — all subsystems, technology choices, cross-links |
| [System Architecture](./system-architecture.md) | Full Mermaid diagram of every component, service, repository, and external integration |

### Frontend

| Document | Purpose |
|---|---|
| [Frontend Architecture](./frontend.md) | Angular Signals stores, offline/IndexedDB model, routing, auth interceptor, component structure |

### Backend

| Document | Purpose |
|---|---|
| [Backend Architecture](./backend.md) | Spring Boot package structure, all 15 services, 12 repositories, layering rules |
| [Backend Component Diagram](./backend-components.md) | Full class-level Mermaid diagram with package relationships and request lifecycle sequence |

### Security and Authentication

| Document | Purpose |
|---|---|
| [Security Architecture](./security.md) | JWT model, token spec, OTP flow, BCrypt, filter chain, tradeoffs |
| [Authentication Flow](./auth-flow.md) | Sequence diagrams — registration, login, token refresh, password reset, logout |

### Data

| Document | Purpose |
|---|---|
| [Data Model](./data-model.md) | All 11 MongoDB collections — field lists, TTL indexes, removed/superseded collections |
| [Tracking Types](./TRACKING_TYPES.md) | TrackingType enum, set field requirements, PR analytics, migration guide |
| [User Settings](./user-settings.md) | UserSettings collection design, frontend signal integration, security notes |

### Operations

| Document | Purpose |
|---|---|
| [Deployment](./deployment.md) | Environment variables, Spring profiles, build commands, deployment checklist |
| [Architecture Review](./architecture-review.md) | Current strengths, risks, scalability concerns, recommended refactors |

---

## Architecture Hierarchy

Each level links to the documents that cover it in detail.

```
overview.md
│
├── system-architecture.md          Full cross-cutting component view
│
├── frontend.md                     Angular SPA
│   └── (auth state, stores, IndexedDB, routing, interceptors)
│
├── backend.md                      Spring Boot API
│   ├── backend-components.md       Class-level diagram + request lifecycle
│   ├── security.md                 Spring Security, JWT, OTP, BCrypt
│   │   └── auth-flow.md            Five auth sequence diagrams
│   ├── data-model.md               MongoDB collections
│   │   ├── TRACKING_TYPES.md       Exercise tracking type specification
│   │   └── user-settings.md        Settings collection and frontend integration
│   └── deployment.md               Environment, build, profiles
│
└── architecture-review.md          Cross-cutting risks and recommendations
```

---

## Quick Links by Topic

| Topic | Document | Section |
|---|---|---|
| How the whole system fits together | [system-architecture.md](./system-architecture.md) | Mermaid diagram |
| JWT access and refresh token design | [security.md](./security.md) | Token Architecture |
| Registration with OTP verification | [auth-flow.md](./auth-flow.md) | Registration Flow |
| Automatic token refresh on 401 | [frontend.md](./frontend.md) | authInterceptor |
| Guest offline workout storage | [frontend.md](./frontend.md) | Offline Support |
| Guest-to-account workout sync | [frontend.md](./frontend.md) | Post-Login Sync |
| PR detection engine | [backend.md](./backend.md) | Progress Evaluation Engine |
| TrackingType per exercise | [TRACKING_TYPES.md](./TRACKING_TYPES.md) | TrackingType Enum |
| All MongoDB collections | [data-model.md](./data-model.md) | Collections |
| WorkoutSet field rules by type | [data-model.md](./data-model.md) | workouts → WorkoutSet |
| UserSettings design rationale | [user-settings.md](./user-settings.md) | Design decision |
| Known security tradeoffs | [security.md](./security.md) | Known Security Tradeoffs |
| Scalability concerns | [architecture-review.md](./architecture-review.md) | Scalability Concerns |
| Environment variables | [deployment.md](./deployment.md) | Environment Variables |
| Backend package list | [backend.md](./backend.md) | Package Structure |
| All backend classes | [backend-components.md](./backend-components.md) | Package Structure diagram |

---

## Architecture Goals

- Mobile-first, minimal-tap workout logging.
- Offline-first for unauthenticated users — full IndexedDB persistence, sync on login.
- Strict controller → service → repository layering — no layer skipping.
- Stateless JWT backend — no server-side sessions.
- Environment-driven configuration — no secrets in source control.
- Documentation updated alongside every implementation change.
