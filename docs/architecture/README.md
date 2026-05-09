# Architecture Documentation

This section describes the technical architecture for Gym Helper.

## Documents

| Document | Purpose |
| --- | --- |
| [Overview](./overview.md) | High-level architecture and system boundaries |
| [Frontend Architecture](./frontend.md) | Angular application structure, routing, state, and UI rules |
| [Backend Architecture](./backend.md) | Express application structure, modules, services, repositories, and error handling |
| [Data Model](./data-model.md) | MongoDB collections, entity relationships, and schema notes |
| [Security](./security.md) | Authentication, authorization, token handling, and security controls |
| [Deployment](./deployment.md) | Environment strategy, build artifacts, hosting notes, and operational concerns |

## Architecture Goals

- Production-ready modular structure.
- Strict TypeScript usage across frontend and backend.
- Small reusable components and services.
- Mobile-first workout logging experience.
- Clear separation between controllers, services, repositories, and schemas.
- Centralized validation and error handling.
- Secure JWT authentication with refresh token support.
