# AnveshakHub Enterprise Application — Technical Architecture Baseline

## 1. System Overview & Technology Stack

The AnveshakHub Enterprise Application is an internal management platform combining CRM and ERP operations into a single connected business system.

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Zod.
- **Backend**: NestJS, TypeScript, REST API (`/api/v1`), OpenAPI/Swagger (`/api/docs`), JWT Authentication, Role/Permission Authorization, Audit Interceptor.
- **Database**: PostgreSQL 16 transactional system of record with Prisma ORM.
- **Background Work**: Redis 7 + BullMQ queue architecture.
- **Document Storage**: Private S3-compatible object storage with short-lived pre-signed URL generation.

---

## 2. Global Non-Ambiguity Rules
1. **One Login**: Single entry point via `/api/v1/auth/login`. No separate portals for Admin, HR, Experts, or Organizations.
2. **Canonical Organization**: All modules (CRM, Project, Finance, Sales) reference the exact same `Organization ID` (`org_number` format `ORG-000001`).
3. **Canonical Employee**: Personnel categories (Expert/Intern) and employment types (Permanent/Temporary) are attributes on the personnel record, not separate tables.
4. **Official 6 Business Verticals**: Master data classification (`BV-01` to `BV-06`). Modules are not split by vertical.
5. **Private Documents**: Documents are stored in private object storage and accessed solely through authorization-validated, short-lived signed URLs.
6. **Server-Side Security**: Frontend hiding of UI buttons is strictly visual polish; every route and API enforces authorization server-side.
