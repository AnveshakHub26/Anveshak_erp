# AnveshakHub Requirement Traceability Matrix (Phase 0 Foundation)

| Requirement ID | Screen ID | API Contract | DB Entity | Test Case | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-FND-001** | FND-01 | `GET /api/v1/public/config` | `system_settings` | `TC-FND-001` | Baseline Ready |
| **FR-FND-002** | FND-02 | `POST /api/v1/auth/login` | `users`, `user_roles` | `TC-FND-002` | Baseline Ready |
| **FR-FND-003** | FND-03 | `POST /api/v1/organizations` | `organizations`, `organization_bvs` | `TC-FND-003` | Baseline Ready |
| **FR-FND-004** | FND-04 | `POST /api/v1/auth/forgot-password` | `users` | `TC-FND-004` | Baseline Ready |
| **FR-FND-008** | FND-08 | `GET /api/v1/search` | Global Entities | `TC-FND-008` | Baseline Ready |
| **FR-FND-009** | FND-09 | `GET /api/v1/notifications` | `notifications` | `TC-FND-009` | Baseline Ready |
| **FR-FND-10** | FND-10 | `GET /api/v1/documents/:id` | `documents`, `document_versions` | `TC-FND-010` | Baseline Ready |
| **NFR-SEC-001** | Global | Server Guards | `roles`, `permissions` | `TC-SEC-001` | Baseline Ready |
| **NFR-AUD-001** | Global | Audit Interceptor | `audit_logs` | `TC-AUD-001` | Baseline Ready |
