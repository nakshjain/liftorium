# Authentication API

Base path:

```text
/api/v1/auth
```

## Register

```http
POST /api/v1/auth/register
```

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

## Login

```http
POST /api/v1/auth/login
```

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

## Refresh Token

```http
POST /api/v1/auth/refresh
```

### Success Response

```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

## Current User

```http
GET /api/v1/auth/me
```

Requires authentication.

## Logout

```http
POST /api/v1/auth/logout
```

Revokes the active refresh token.
