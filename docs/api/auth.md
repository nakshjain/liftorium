# Authentication API

Base path:

```text
/api/v1/auth
```

## Register with Email Verification (Recommended)

### Initiate Registration

```http
POST /api/v1/auth/register/initiate
```

Sends a 6-digit OTP to the provided email through Resend. The OTP expiry is controlled by `app.otp.expiry-minutes` and currently defaults to 10 minutes. Rate limited to 3 attempts per 10-minute window per email.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "displayName": "Alex"
}
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "message": "Verification code sent to your email"
  }
}
```

#### Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email is already attached to an account |
| `429` | `OTP_RATE_LIMITED` | Too many OTP requests in the rate limit window |
| `422` | `VALIDATION_ERROR` | Request body failed validation |
| `500` | `EMAIL_SEND_FAILED` | Failed to send verification email |

### Verify Registration

```http
POST /api/v1/auth/register/verify
```

Verifies the OTP, creates the user account, starts a session, sets an HTTP-only refresh token cookie, and returns an access token.

#### Request Body

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Success Response

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

#### Error Cases

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `OTP_EXPIRED` | Verification code has expired or does not exist |
| `400` | `OTP_INVALID` | Verification code is incorrect |
| `409` | `EMAIL_ALREADY_REGISTERED` | Email was registered after OTP was sent |
| `422` | `VALIDATION_ERROR` | Request body failed validation |

## Register (Direct)

```http
POST /api/v1/auth/register
```

Creates a user without email verification, starts a session, sets an HTTP-only refresh token cookie, and returns an access token. Use the OTP flow above for production registrations.

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
