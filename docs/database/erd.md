# AnveshakHub Enterprise Database ERD & Entity Specification

## Entity-Relationship Blueprint (Foundation Layer)

```mermaid
erDiagram
    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned_to"
    roles ||--o{ role_permissions : "contains"
    permissions ||--o{ role_permissions : "granted_to"
    
    users ||--o{ organization_users : "belongs_to"
    organizations ||--o{ organization_users : "employs"
    
    business_verticals ||--o{ organizations : "primary_bv"
    business_verticals ||--o{ organization_business_verticals : "additional_bvs"
    organizations ||--o{ organization_business_verticals : "linked_bvs"
    
    users ||--o{ documents : "uploads"
    documents ||--o{ document_versions : "has_versions"
    
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "triggers"
```

## Core Entity Dictionary

| Entity | Canonical Prefix / Primary Key | Key Attributes | Required Relationships |
| :--- | :--- | :--- | :--- |
| **users** | `UUID` | `email`, `password_hash`, `status` | `user_roles`, `org_users` |
| **roles** | `UUID` | `code`, `name`, `description` | `role_permissions`, `user_roles` |
| **permissions** | `UUID` | `code`, `resource`, `action` | `role_permissions` |
| **organizations** | `org_number` (`ORG-000001`) | `legal_name`, `type`, `website` | `primary_bv`, `organization_bvs` |
| **business_verticals** | `code` (`BV-01`..`BV-06`) | `name`, `sort_order`, `active` | `organizations` |
| **documents** | `UUID` | `entity_type`, `entity_id`, `storage_key` | `document_versions`, `uploaded_by` |
| **audit_logs** | `UUID` | `actor_user_id`, `action`, `before_json` | `users` |
```
