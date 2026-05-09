# Release Workflow

## Release Readiness Checklist

- [ ] Authentication flow verified.
- [ ] Protected API routes verified.
- [ ] Core workout tracking flow verified.
- [ ] Database indexes reviewed.
- [ ] Environment variables documented.
- [ ] Production build succeeds.
- [ ] Tests pass.
- [ ] API docs updated.
- [ ] Progress tracker updated.

## Pre-Deployment Checks

- Confirm `NODE_ENV=production`.
- Confirm MongoDB connection string.
- Confirm JWT secrets are strong and private.
- Confirm CORS origin is restricted.
- Confirm refresh token handling is secure.
- Confirm error responses do not expose internals.

## Post-Deployment Checks

- Verify health endpoint.
- Register and login with a test user.
- Create and complete a test workout.
- Check server logs for errors.
- Confirm frontend points to the correct API base URL.
