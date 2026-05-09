# API Conventions

## Base Path

```text
/api/v1
```

## Authentication

Protected endpoints require an access token.

```http
Authorization: Bearer <access_token>
```

## Success Response

```json
{
  "success": true,
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

## Common HTTP Status Codes

| Status | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created |
| `400` | Invalid request |
| `401` | Authentication required or invalid |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Resource conflict |
| `422` | Validation failed |
| `500` | Unexpected server error |

## Pagination

Recommended query parameters:

```text
?page=1&limit=20
```

Recommended paginated response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```
