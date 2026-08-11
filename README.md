# AnveshakHub Enterprise Application — Master Monorepo

Welcome to the **AnveshakHub Enterprise Application** repository. This is an enterprise-grade platform combining CRM and ERP-style operations into a single connected system.

## 🏗️ Architecture Overview

The system is structured as a clean production monorepo:

- `apps/web`: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand.
- `apps/api`: NestJS, REST API (`/api/v1`), OpenAPI/Swagger (`/api/docs`), JWT & RBAC Auth, Audit Logging.
- `prisma/`: Prisma ORM schema, PostgreSQL migrations, and master configuration seed script.
- `packages/`: Shared packages (`types`, `validation`, `config`).
- `docs/`: Comprehensive architecture, database ERD, API reference, and requirement traceability documentation.
- `docker/`: Docker Compose configurations for PostgreSQL 16 and Redis 7.

---

## 🚀 Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker & Docker Compose**: Installed and running locally

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Database & Redis Infrastructure
Launch PostgreSQL and Redis containers using Docker Compose:
```bash
npm run docker:up
```

### 4. Database Setup & Seeding
Generate Prisma Client, run migrations, and seed official master data (6 Business Verticals, Default Roles & Permissions, Super Admin):
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Running Backend & Frontend Services

**Backend API (NestJS - Port 4000):**
```bash
npm run dev:api
```
- API Base Path: `http://localhost:4000/api/v1`
- Swagger Documentation: `http://localhost:4000/api/docs`

**Frontend Web App (Next.js - Port 3000):**
```bash
npm run dev:web
```
- Frontend Web Access: `http://localhost:3000`

---

## 🧪 Testing

- **Backend Unit & Integration Tests**:
  ```bash
  npm run test:api
  ```
- **End-to-End Playwright Tests**:
  ```bash
  npm run test:e2e
  ```

---

## 📋 Non-Negotiable Engineering Rules
1. **One Login**: All users log in through `/api/v1/auth/login`.
2. **Canonical Identifiers**: CRM, Project, HR, Sales, Purchase, and Finance reference the exact same `Organization ID` and `User ID`.
3. **No Direct DB Access**: Frontend NEVER connects directly to PostgreSQL. All operations flow through NestJS backend REST APIs.
4. **Server-Side Security**: Frontend hiding of buttons is UI polish; authorization is strictly enforced server-side.
5. **No Hardcoded Business Data**: Zero fake business data (employees, projects, invoices, etc.) is permitted. Master data is restricted to approved configuration (e.g. 6 BVs, Roles, Permissions).
