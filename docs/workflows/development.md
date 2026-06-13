# Development Workflow

## Feature Workflow

1. Read the relevant architecture and API documentation.
2. Confirm the feature scope against MVP priorities.
3. Implement the smallest production-ready slice.
4. Add or update tests based on risk.
5. Update documentation in `/docs`.
6. Run verification commands.
7. Commit with a meaningful message when stable.

## Branching

Use short-lived feature branches when collaborating.

Recommended branch format:

```text
feature/auth-module
feature/workout-tracking
fix/token-refresh
```

## Commit Style

Examples:

```text
feat: implement JWT authentication
feat: add workout tracking module
refactor: optimize exercise service
docs: add API documentation scaffold
feat: migrated backend from express to spring boot
```

## Definition Of Done

- [ ] Feature works locally.
- [ ] Relevant tests pass.
- [ ] API contracts are documented.
- [ ] Architecture notes are updated when needed.
- [ ] Progress tracker has a dated entry.
- [ ] No unrelated files were changed.

## Backend Commands

```bash
cd backend
mvn spring-boot:run
mvn clean package
```

## Backend Configuration

The backend uses Spring Boot profile-specific properties:

- `application.properties` sets the app name and default development profile.
- `application-development.properties` contains development runtime values.
- `application-production.properties` contains environment placeholders for deployed runtimes.

For IntelliJ local runs, open `LiftoriumApplication` and click the play button. The default development profile loads automatically.
