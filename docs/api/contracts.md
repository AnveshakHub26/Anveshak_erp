# AnveshakHub REST API Specifications & Error Handling Conventions

## API Base Path
All REST APIs are served under the `/api/v1` namespace. OpenAPI Swagger documentation is available interactively at `/api/docs`.

## Response Envelopes

### Success Envelope (HTTP 200/201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "correlationId": "8f7e2c01-3b4d-4e9f-8a21-7c91a02f3e8b",
  "timestamp": "2026-08-11T14:30:00.000Z"
}
```

### Error Envelope (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "errors": {
    "email": ["Please enter a valid email address"]
  },
  "correlationId": "8f7e2c01-3b4d-4e9f-8a21-7c91a02f3e8b",
  "timestamp": "2026-08-11T14:30:00.000Z"
}
```

## Foundation Endpoints Summary

- `POST /api/v1/auth/login`: FND-02 Common login endpoint.
- `POST /api/v1/auth/forgot-password`: FND-04 Password recovery start.
- `GET /api/v1/auth/me`: Get active user profile and resolved RBAC permissions.
- `GET /api/v1/business-verticals`: Fetch 6 official Business Verticals (`BV-01` to `BV-06`).
- `GET /api/v1/organizations`: Paginated search of canonical business entities.
- `GET /api/v1/documents/:id/download-url`: Generate short-lived pre-signed URL for protected files.
- `GET /api/v1/notifications`: FND-09 In-app notification inbox.
- `GET /api/v1/audit-logs`: ADM-05 Immutable security audit trail.
- `GET /api/v1/admin/health`: ADM-06 System connectivity and health status.
