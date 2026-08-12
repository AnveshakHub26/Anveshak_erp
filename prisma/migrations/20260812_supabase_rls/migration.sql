-- =============================================================================
-- AnveshakHub Enterprise – Supabase RLS Defense-in-Depth Migration
-- Version: v2 (Genuine Tenant Isolation)
-- =============================================================================
--
-- DESIGN RATIONALE
-- ================
-- NestJS + Prisma is the authoritative application/business authorization layer.
-- Prisma connects as `anveshak_user`, which has the Superuser + Bypass RLS
-- attributes on the local PostgreSQL instance and maps to service_role on
-- Supabase Managed PostgreSQL.  That connection is NOT subject to RLS by
-- default and FORCE ROW LEVEL SECURITY must NOT be set on tables accessed by
-- Prisma — doing so would break all NestJS database operations.
--
-- RLS is therefore applied as a SECOND LINE OF DEFENSE that restricts any
-- direct, unauthenticated or impersonated Supabase Data API / PostgREST client
-- access to tenant-scoped rows.  It does not filter NestJS/Prisma queries.
--
-- KEY CHOICES
-- ===========
-- 1. ENABLE ROW LEVEL SECURITY (without FORCE) on the five sensitive tables.
--    This means Bypass-RLS roles (service_role / Superuser) are unaffected.
-- 2. NO service_role USING(true) policies — those are redundant because
--    service_role already bypasses RLS; adding them creates a false sense of
--    security without adding any real boundary.
-- 3. Policies target the `authenticated` role, which is what a Supabase client
--    uses when it presents a valid JWT issued by Supabase Auth.
--    The policies extract the Supabase Auth user ID from the JWT claim
--    `auth.uid()` — a built-in Supabase/PostgREST helper.
-- 4. No custom JWT claims, invented columns, or invented roles are required.
--    Every USING() expression refers only to actual columns in the existing
--    schema (`organization_id`, `user_id`, `uploaded_by`, `recipient_user_id`,
--    `actor_user_id`).
-- 5. ADMIN: the ADMIN account is a normal ERP user whose ID maps to exactly
--    one Supabase Auth identity.  NestJS enforces ADMIN authority through
--    RolesGuard.  At the RLS layer, ADMIN is handled the same as any other
--    authenticated user — they can only see rows they are directly associated
--    with through the standard relationship columns.  Full cross-tenant admin
--    access is intentionally left to NestJS/Prisma (service_role path).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Enable RLS (without FORCE) on all five sensitive tables
-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY without FORCE ROW LEVEL SECURITY so that:
--   • The Prisma/NestJS database role (Superuser / service_role) bypasses RLS
--     completely — no queries are filtered.
--   • Any direct PostgREST / anon / authenticated client query IS filtered.

ALTER TABLE "organizations"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"         ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- STEP 2: Drop the old broad service_role USING(true) policies if they exist
-- (They are redundant because service_role already bypasses RLS)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    _policies text[] := ARRAY[
        'service_role_all_organizations',
        'service_role_all_org_users',
        'service_role_all_documents',
        'service_role_all_notifications',
        'service_role_all_audit_logs'
    ];
    _tables text[] := ARRAY[
        'organizations',
        'organization_users',
        'documents',
        'notifications',
        'audit_logs'
    ];
    i int;
BEGIN
    FOR i IN 1..array_length(_policies, 1) LOOP
        IF EXISTS (
            SELECT 1 FROM pg_policies
            WHERE policyname = _policies[i]
              AND tablename  = _tables[i]
        ) THEN
            EXECUTE format('DROP POLICY %I ON %I', _policies[i], _tables[i]);
        END IF;
    END LOOP;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 3: Tenant-Isolation Policies for `organizations`
-- ---------------------------------------------------------------------------
-- An authenticated user may SELECT an organization only if they have a
-- corresponding row in organization_users linking their Supabase Auth uid
-- to that organization.
-- NestJS/Prisma (service_role/Superuser) is unaffected by these policies.

DO $$
BEGIN
    -- SELECT: user can see orgs they belong to
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organizations'
          AND policyname = 'tenant_org_select'
    ) THEN
        CREATE POLICY "tenant_org_select"
        ON "organizations"
        FOR SELECT
        TO authenticated
        USING (
            id IN (
                SELECT organization_id
                FROM organization_users
                WHERE user_id = (SELECT auth.uid()::text)
            )
        );
    END IF;

    -- INSERT / UPDATE / DELETE: deny all direct authenticated-client writes;
    -- all mutations go through NestJS API (service_role path, bypasses RLS).
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organizations'
          AND policyname = 'tenant_org_write_deny'
    ) THEN
        CREATE POLICY "tenant_org_write_deny"
        ON "organizations"
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 4: Tenant-Isolation Policies for `organization_users`
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    -- SELECT: user can see org_user rows where they are the user
    -- OR where the org is one they already belong to (to see colleagues).
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organization_users'
          AND policyname = 'tenant_orguser_select'
    ) THEN
        CREATE POLICY "tenant_orguser_select"
        ON "organization_users"
        FOR SELECT
        TO authenticated
        USING (
            user_id = (SELECT auth.uid()::text)
            OR
            organization_id IN (
                SELECT organization_id
                FROM organization_users ou2
                WHERE ou2.user_id = (SELECT auth.uid()::text)
            )
        );
    END IF;

    -- Deny all writes from authenticated clients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'organization_users'
          AND policyname = 'tenant_orguser_write_deny'
    ) THEN
        CREATE POLICY "tenant_orguser_write_deny"
        ON "organization_users"
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 5: Tenant-Isolation Policies for `documents`
-- ---------------------------------------------------------------------------
-- A document is tied to an entity (entityType + entityId).  For Organization
-- entities the entityId is the organization UUID.  For other entity types
-- NestJS enforces access; the RLS policy conservatively allows the uploader
-- to see their own documents and scopes Organization-entity documents to the
-- uploading user's org memberships.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'documents'
          AND policyname = 'tenant_documents_select'
    ) THEN
        CREATE POLICY "tenant_documents_select"
        ON "documents"
        FOR SELECT
        TO authenticated
        USING (
            -- Uploader can always see their own uploads
            uploaded_by = (SELECT auth.uid()::text)
            OR
            -- Organization-scoped documents: user must belong to the org
            (
                entity_type = 'Organization'
                AND entity_id IN (
                    SELECT organization_id
                    FROM organization_users
                    WHERE user_id = (SELECT auth.uid()::text)
                )
            )
        );
    END IF;

    -- Deny all writes from authenticated clients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'documents'
          AND policyname = 'tenant_documents_write_deny'
    ) THEN
        CREATE POLICY "tenant_documents_write_deny"
        ON "documents"
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 6: User-Scoped Policies for `notifications`
-- ---------------------------------------------------------------------------
-- Notifications are addressed to a specific user via recipient_user_id.
-- A user may only read their own notifications.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notifications'
          AND policyname = 'tenant_notifications_select'
    ) THEN
        CREATE POLICY "tenant_notifications_select"
        ON "notifications"
        FOR SELECT
        TO authenticated
        USING (
            recipient_user_id = (SELECT auth.uid()::text)
        );
    END IF;

    -- Deny all writes from authenticated clients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notifications'
          AND policyname = 'tenant_notifications_write_deny'
    ) THEN
        CREATE POLICY "tenant_notifications_write_deny"
        ON "notifications"
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- STEP 7: Actor-Scoped Policies for `audit_logs`
-- ---------------------------------------------------------------------------
-- Audit logs are immutable records.  A user may read only the audit log
-- entries they authored (actor_user_id = their uid).
-- Cross-tenant audit access is a privileged ADMIN operation handled
-- exclusively by NestJS (service_role path, bypasses RLS).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs'
          AND policyname = 'tenant_auditlogs_select'
    ) THEN
        CREATE POLICY "tenant_auditlogs_select"
        ON "audit_logs"
        FOR SELECT
        TO authenticated
        USING (
            actor_user_id = (SELECT auth.uid()::text)
        );
    END IF;

    -- Deny all writes from authenticated clients (audit_logs are append-only
    -- from the NestJS service_role path; no direct client writes allowed)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs'
          AND policyname = 'tenant_auditlogs_write_deny'
    ) THEN
        CREATE POLICY "tenant_auditlogs_write_deny"
        ON "audit_logs"
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
    END IF;
END $$;
