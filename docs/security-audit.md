# Production Security Architecture & Audit Report
**AnveshakHub Enterprise Operations ERP Platform**

---

## 1. Executive Security Architecture

### Authentication Model
- **Single Authentication Authority**: Integrates with Supabase Auth (`supabase.auth.admin`) with fallback to local argon2-hashed password verification.
- **JWT Tokens & Storage**: Short-lived Access Tokens (24h) and Refresh Tokens (7 days) delivered via `HttpOnly`, `Secure` (in production), and `SameSite` protected cookies (`access_token` and `refresh_token`).
- **Single-Use Recovery**: Password reset uses cryptographically random single-use tokens (`crypto.randomBytes(32).toString('hex')`) with a 1-hour expiration window.
- **Brute-Force Rate-Limiting**: `@Throttle({ default: { limit: 10, ttl: 60000 } })` enforced on `/auth/login` and 5 req/min on password recovery endpoints.

### Authorization & Multi-Tenant Isolation Model
- **Server-Side Guards Pipeline**: Every protected endpoint evaluates `@UseGuards(JwtAuthGuard, RolesGuard)`.
- **Role Hierarchy**: System Administrator (`ADMIN`), Human Resources Officer (`HR`), Project Manager (`PM`), Workforce (`STAFF`, `INTERN`, `EXPERT`, `QA`, `LEGAL`), Organization Partner (`ORG_USER`).
- **Organization Isolation**: `OrganizationIsolationGuard` validates that `ORG_USER` accounts can only access records matching their `organizationId`.
- **HR 4-Eyes Governance Rule**: `approveLeaveRequest` strictly blocks HR/Admin officers from self-approving their own leave applications (`request.employee?.userId === hrUser.id`).
- **Resource Ownership & BOLA Checks**: `verifyEntityAuthorization` and `checkEntityAccess` enforce that employees can only view/download their own employee documents and assigned project files.

### Document & File Security Model
- **Presigned Upload & Download URLs**: Direct public S3/Supabase bucket access is prohibited. All uploads and downloads use time-limited presigned URLs (300 seconds expiration).
- **Dangerous Extension Blocking**: Rejects executable and script formats (`.exe`, `.dll`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.vbs`, `.ps1`, `.py`, `.jar`, `.msi`, `.scr`, `.com`, `.htm`, `.html`) prior to presigned URL generation.
- **MIME Whitelisting**: Strict MIME type enforcement (`ALLOWED_MIME_TYPES`: PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, TXT, ZIP) and 25 MB max file size.
- **Path Traversal Protection**: Storage object keys are generated programmatically (`{entityType}/{entityId}/{timestamp}_{sanitizedFilename}`) and never rely on untrusted raw client paths.
- **Malware Scanning Distinction**: Dangerous extension blocking and MIME type checks provide upfront file validation. Infrastructure-level malware scanning (e.g. ClamAV daemon container) is documented as an asynchronous background scanning service.

### Browser Security & Headers
- **Helmet Middleware**: Enforces `Strict-Transport-Security` (`max-age=31536000; includeSubDomains; preload`), `X-Frame-Options: DENY` (iframe clickjacking prevention), `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **CORS Hardening**: Strict origin whitelist matching `APP_URL`, `ALLOWED_ORIGINS`, and Vercel production domains with `credentials: true`.

### Immutable Audit Logging
- **`AuditInterceptor` & `AuditLog` Entity**: Captures actor ID, action name, target entity type, entity ID, and sanitised JSON state changes (`LEAVE_SUBMITTED`, `LEAVE_APPROVED`, `DOWNLOAD_DOCUMENT`, `USER_CREATED`, `ROLE_UPDATED`).

---

## 2. Prioritized Security Findings & Remediation

| Finding ID | Vulnerability | Severity | Exact File / Component | Exploit Scenario | Fix & Mitigation Status |
|---|---|---|---|---|---|
| **SEC-01** | Missing Rate Limiting on Auth Endpoints | **HIGH** | `apps/api/src/modules/auth/auth.controller.ts` | Automated brute-force credential stuffing on `/auth/login`. | **FIXED**: Applied `@Throttle({ default: { limit: 10, ttl: 60000 } })`. |
| **SEC-02** | Unrestricted Upload Presigned URL Spam | **MEDIUM** | `apps/api/src/modules/documents/documents.controller.ts` | Bot spamming upload URL requests causing storage key pollution. | **FIXED**: Applied `@Throttle({ default: { limit: 20, ttl: 60000 } })`. |
| **SEC-03** | Executable File Upload Risk | **MEDIUM** | `apps/api/src/modules/documents/documents.service.ts` | Uploading malicious script files (`.exe`, `.sh`, `.php`, `.js`). | **FIXED**: Implemented `DANGEROUS_EXTENSIONS` set blocking. |
| **SEC-04** | Missing HSTS & Clickjacking Protection | **MEDIUM** | `apps/api/src/main.ts` & `apps/web/next.config.mjs` | Man-in-the-middle downgrade or clickjacking iframe embedding. | **FIXED**: Configured Helmet `hsts`, `frameguard: { action: 'deny' }`, and Next.js security headers. |
| **SEC-05** | Cross-Entity Folder Move | **LOW** | `apps/api/src/modules/documents/documents.service.ts` | Moving a folder from Org A to Org B. | **FIXED**: `moveFolder` verifies entity match and blocks cross-entity moves. |

---

## 3. Threat Model & Operational Limitations

### Protected Boundaries
- **Unauthenticated API Access**: Blocked by `JwtAuthGuard` (returns `401 Unauthorized`).
- **Role Escalation**: Blocked by `RolesGuard` (returns `403 Forbidden`).
- **Cross-Tenant Data Exposure**: Blocked by `OrganizationIsolationGuard` and `checkEntityAccess` (returns `403 Forbidden`).
- **HR Self-Approval Bypass**: Blocked by `approveLeaveRequest` (returns `403 Forbidden`).

### Remaining Operational Limitations
1. **Asynchronous Deep Malware Scanning**:
   - Upfront extension and MIME checks block known script vectors. For full zero-day file payload inspection, integrate an asynchronous ClamAV ICAP microservice webhook for uploaded S3 objects.
2. **Cloud WAF & DDoS Mitigation**:
   - Application-level rate limiting (`@nestjs/throttler`) protects NestJS processes. Place Cloudflare WAF or AWS Shield in front of your domain for network-layer volumetric DDoS protection.
