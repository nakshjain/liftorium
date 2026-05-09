# Deployment Notes

## Environments

| Environment | Purpose |
| --- | --- |
| Local | Developer workstation |
| Preview | Feature validation before release |
| Production | Live user-facing app |

## Configuration

Configuration must come from environment variables.

Backend examples:

```text
NODE_ENV=
PORT=
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=
REFRESH_TOKEN_TTL=
CORS_ORIGIN=
```

Frontend examples:

```text
API_BASE_URL=
```

## Build Artifacts

- Frontend: Angular production build.
- Backend: Compiled TypeScript output.

## Operational Checklist

- [ ] Environment variables configured.
- [ ] MongoDB connection tested.
- [ ] CORS restricted to allowed origins.
- [ ] JWT secrets generated securely.
- [ ] Error logging configured.
- [ ] Health endpoint available.
- [ ] Database indexes applied.
