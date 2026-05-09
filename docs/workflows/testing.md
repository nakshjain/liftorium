# Testing Workflow

## Testing Strategy

Tests should scale with the risk and blast radius of a change.

## Backend Testing

Recommended coverage:

- Unit tests for services.
- Repository tests for persistence behavior.
- Integration tests for API endpoints.
- Auth tests for token and ownership behavior.

## Frontend Testing

Recommended coverage:

- Component tests for important UI states.
- Service tests for API clients and state services.
- Route guard tests for protected pages.
- End-to-end tests for critical user journeys when available.

## Critical User Journeys

- Register a new account.
- Login and refresh session.
- Create an active workout.
- Add exercises and sets.
- Complete a workout.
- View workout history.

## Verification Checklist

- [ ] Type checking passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass when relevant.
- [ ] Linting passes.
- [ ] Mobile layout is checked for frontend changes.
- [ ] API documentation matches implemented behavior.
