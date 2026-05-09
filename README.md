# Gym Helper

Gym Helper is a production-minded workout tracking application designed for fast, focused use during real gym sessions.

The goal is to build a clean MVP with a scalable foundation: secure authentication, efficient workout logging, an exercise database, workout history, progress analytics, and personal record tracking.

## Project Overview

Gym Helper is built as a full-stack web application with a mobile-first user experience.

Core product goals:

- Fast workout logging with minimal taps.
- Clean dark UI optimized for gym environments.
- Secure user authentication with refresh tokens.
- Modular architecture that can grow beyond the MVP.
- Comprehensive engineering documentation maintained alongside code.
- AI-assisted implementation workflow with prompt history and decision records.

## Current Status

The project is in early MVP development.

Implemented:

- Angular frontend scaffold.
- Express and TypeScript backend foundation.
- JWT authentication backend module.
- MongoDB user and refresh token persistence.
- Exercise database backend module.
- Workout session backend module.
- Angular authentication flow.
- Project documentation structure.
- Architecture decision records and implementation summaries.

Next focus:

- Backend auth integration tests.
- Frontend auth flow tests.
- Frontend workout logging UI.

## Tech Stack

### Frontend

- Angular
- TypeScript
- Standalone components
- Angular routing
- Angular Signals where appropriate
- TailwindCSS planned for production UI styling
- Mobile-first responsive UI

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT authentication
- HTTP-only refresh token cookies
- Zod validation

### Engineering

- Modular architecture
- Strict TypeScript
- Controller/service/repository backend structure
- Centralized validation and error handling
- Documentation-first feature tracking
- AI-assisted development workflow

## Architecture

```text
User
  -> Angular Frontend
  -> Express REST API
  -> MongoDB
```

### Backend Request Flow

```text
Route
  -> Validation Middleware
  -> Auth Middleware when required
  -> Controller
  -> Service
  -> Repository
  -> MongoDB
```

### Repository Structure

```text
gym/
  backend/
    src/
      config/
      middleware/
      modules/
        auth/
        users/
      shared/
      app.ts
      server.ts
  frontend/
    src/
      app/
  docs/
    api/
    architecture/
    decisions/
    progress/
    prompts/
    workflows/
```

## Authentication

The backend authentication module uses:

- Short-lived JWT access tokens.
- HTTP-only refresh token cookies.
- Refresh token rotation.
- Refresh token revocation on logout.
- Deterministic HMAC-SHA256 refresh token hashes in MongoDB.
- Zod request validation.
- Centralized API error responses.

See [JWT Refresh Token Strategy](./docs/decisions/0002-jwt-refresh-token-strategy.md) for the architecture decision.

## Setup Instructions

### Prerequisites

- Node.js
- npm
- MongoDB running locally or a MongoDB connection string

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Update `backend/.env` with local values:

```text
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/gym-helper
CORS_ORIGIN=http://localhost:4200
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
REFRESH_TOKEN_COOKIE_NAME=gym_refresh_token
```

Backend scripts:

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend scripts:

```bash
npm start
npm run build
npm test
```

## API

Base API path:

```text
/api/v1
```

Authentication endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

See [API Documentation](./docs/api/README.md) for full contracts.

## Screenshots

Screenshots will be added as the UI moves beyond scaffold state.

### Mobile Workout Logging

```text
[Screenshot placeholder: active workout logging screen]
```

### Exercise Search

```text
[Screenshot placeholder: exercise database search]
```

### Workout History

```text
[Screenshot placeholder: completed workout history]
```

### Progress Analytics

```text
[Screenshot placeholder: progress dashboard]
```

## AI-Assisted Workflow

This project is intentionally developed with AI-assisted engineering workflows.

The workflow includes:

- Brief implementation approach before coding.
- Modular, production-ready code changes.
- Continuous documentation updates.
- Prompt history for major implementation requests.
- Architecture decision records for meaningful technical choices.
- Progress logs and implementation summaries after major features.

Important workflow documents:

- [AI Workflow](./docs/workflows/ai-workflow.md)
- [Prompt History](./docs/prompts/prompt-log.md)
- [Progress Log](./docs/progress/progress-log.md)
- [Architecture Decisions](./docs/decisions/README.md)

## Documentation Structure

```text
docs/
  architecture/   System, frontend, backend, data, security, deployment notes
  api/            REST API conventions and endpoint contracts
  decisions/      Architecture decision records
  progress/       MVP roadmap, progress log, open tasks, summaries
  prompts/        Prompt history and reusable AI prompts
  workflows/      Development, testing, release, and AI workflows
```

Start here: [Project Documentation](./docs/README.md)

## Roadmap

| Priority | Feature | Status |
| --- | --- | --- |
| 1 | Authentication | In progress |
| 2 | Workout tracking | In progress |
| 3 | Exercise database | In progress |
| 4 | Workout history | Not started |
| 5 | Progress analytics | Not started |
| 6 | PR tracking | Not started |

MVP completion means a user can register, log in, start a workout, add exercises, log sets, complete the workout, and view workout history.

## Scalability Considerations

### Application Architecture

- Feature modules keep backend domains isolated.
- Controller/service/repository separation keeps HTTP, business logic, and persistence concerns independent.
- Angular feature routes can be lazy loaded as the frontend grows.
- Shared middleware and utilities reduce duplication.

### Data And Performance

- User-owned data should always be queried with ownership constraints.
- Workout history should be indexed by `userId` and workout date.
- Exercise search should use indexed fields and can later move to dedicated search infrastructure if needed.
- Refresh token records support revocation and future session management.

### Security

- JWT access tokens are short-lived.
- Refresh tokens are stored in HTTP-only cookies.
- Raw refresh tokens are never persisted.
- Request validation is centralized.
- Rate limiting should be added to authentication endpoints before production launch.

### Future Growth

The current architecture can grow toward:

- Exercise templates and reusable workout plans.
- Advanced progress analytics.
- Personal record tracking.
- Offline-friendly workout logging.
- Multi-device session management.
- Coach or team features if the product expands.

## Development Quality Bar

- Strict TypeScript.
- No `any`.
- Small reusable modules.
- Production-ready implementations.
- Documentation updated with feature work.
- Meaningful commits after stable changes.

## License

License to be decided.
