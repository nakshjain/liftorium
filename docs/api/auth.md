# Authentication API

Base path:

```text
/api/v1/auth
```

## Register

```http
POST /api/v1/auth/register
```

Creates a user, starts a session, sets an HTTP-only refresh token cookie, and returns an access token.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "displayName": "Alex"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "Alex"
    },
    "accessToken": "jwt_access_token"
  }
}
```

### Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email is already attached to an account |
| `422` | `VALIDATION_ERROR` | Request body failed validation |

## Login

```http
POST /api/v1/auth/login
```

Authenticates credentials, sets an HTTP-only refresh token cookie, and returns an access token.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "Alex"
    },
    "accessToken": "jwt_access_token"
  }
}
```

### Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `INVALID_CREDENTIALS` | Email or password is incorrect |
| `422` | `VALIDATION_ERROR` | Request body failed validation |

## Refresh Token

```http
POST /api/v1/auth/refresh
```

Uses the refresh token cookie to rotate the refresh token and issue a new access token.

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "Alex"
    },
    "accessToken": "new_jwt_access_token"
  }
}
```

### Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `REFRESH_TOKEN_REQUIRED` | Refresh token cookie is missing |
| `401` | `INVALID_REFRESH_TOKEN` | Refresh token is invalid, expired, revoked, or linked to a missing user |

## Current User

```http
GET /api/v1/auth/me
```

Requires authentication.

### Success Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "displayName": "Alex"
    }
  }
}
```

## Logout

```http
POST /api/v1/auth/logout
```

Revokes the active refresh token.

### Success Response

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```
