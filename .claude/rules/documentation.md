---
description: Documentation update requirements after implementation
alwaysApply: true
---

# Documentation Requirements

## Documentation Updates

When implementing a feature, bug fix, refactor, or architectural change, update relevant documentation before considering the task complete.

## Writing Style

* Keep documentation terse and scannable.
* Use code blocks for API contracts and file paths.
* No marketing language or filler.
* Describe what exists, not what could exist.

## API Documentation

Update `/docs/api/` when:

* Adding endpoints
* Modifying request DTOs
* Modifying response DTOs
* Changing authentication requirements
* Changing validation rules
* Changing error responses

Document:

* Endpoint URL
* HTTP method
* Request contract
* Response contract
* Authentication requirements
* Error responses

## Architecture Documentation

Update `/docs/architecture/` when:

* Adding new services
* Adding new stores
* Introducing new modules
* Changing system interactions
* Modifying data models
* Changing deployment architecture

## Decision Records

Create or update files under `/docs/decisions/` when:

* Introducing new technologies
* Replacing major libraries
* Making significant architectural decisions
* Changing long-term project direction

Record:

* Decision
* Context
* Alternatives considered
* Consequences

## Progress Tracking

Update `/docs/progress/progress-log.md` with:

* Completed work
* Current status
* Outstanding tasks
* Recommended next steps

## Completion Criteria

A feature is not considered complete until all affected documentation has been updated.
- Do not create documentation for speculative or unimplemented features.
- Documentation must reflect the current implementation only.
