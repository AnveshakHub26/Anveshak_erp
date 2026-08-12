import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { S3StorageAdapter } from '../documents/storage.adapter';
import { DocumentsService } from '../documents/documents.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrganizationIsolationGuard } from '../../common/guards/organization-isolation.guard';

describe('Supabase Auth Single Authority Architecture Verification Suite', () => {
  let authService: AuthService;
  let documentsService: DocumentsService;
  let supabaseService: SupabaseService;

  const mockAdminUser = {
    id: 'admin-uuid-001',
    email: 'admin@anveshakhub.com',
    status: 'ACTIVE',
    mustChangePassword: true,
    userRoles: [
      {
        role: {
          code: 'ADMIN',
          rolePermissions: [{ permission: { code: 'organization:create' } }],
        },
      },
    ],
    orgUsers: [{ organization: { id: 'org-001', orgNumber: 'ORG-001', legalName: 'Anveshak Core Org' } }],
  };

  const mockDocument = {
    id: 'doc-uuid-001',
    entityType: 'Organization',
    entityId: 'org-001',
    type: 'Registration',
    storageKey: 'organization/org-001/doc_01.pdf',
    scanStatus: 'CLEAN',
    visibility: 'PRIVATE',
    uploadedBy: 'admin-uuid-001',
    versions: [{ id: 'ver-1', version: 1, storageKey: 'organization/org-001/doc_01.pdf', checksum: 'abc123sha' }],
    uploader: { id: 'admin-uuid-001', email: 'admin@anveshakhub.com' },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-01' }),
    },
  };

  const mockSupabaseService = {
    isOperational: true,
    getClient: jest.fn().mockReturnValue(null),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: { id: 'admin-uuid-001', email: 'admin@anveshakhub.com' },
        session: { access_token: 'supa_jwt_access_token_123', refresh_token: 'supa_jwt_refresh_token_456' },
      },
      error: null,
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUserPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-uuid-001' } }, error: null }),
    ensureSupabaseAuthUser: jest.fn().mockResolvedValue({ id: 'admin-uuid-001', email: 'admin@anveshakhub.com' }),
    adminAuth: {
      getUserById: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-uuid-001' } } }),
      createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-uuid-001' } } }),
      updateUserById: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-uuid-001' } } }),
    },
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://supabase.co/storage/v1/object/signed/anveshak-private-documents/doc_01.pdf?token=abc' }, error: null }),
        createSignedUploadUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://supabase.co/storage/v1/object/upload/anveshak-private-documents/upload.pdf?token=abc' }, error: null }),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        DocumentsService,
        S3StorageAdapter,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    documentsService = module.get<DocumentsService>(DocumentsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  // 1. SINGLE AUTHENTICATION AUTHORITY LOGIN & SESSION DISPATCH
  it('1. Single Auth Authority: Delegates login to Supabase Auth and returns Supabase session tokens', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(mockAdminUser);
    mockPrismaService.user.update.mockResolvedValue(mockAdminUser);

    const mockResponse = { cookie: jest.fn() } as any;
    const res = await authService.login({ email: 'admin@anveshakhub.com', password: 'SupabaseSecretPassword2026!' }, mockResponse);

    expect(res.success).toBe(true);
    expect(res.user.email).toBe('admin@anveshakhub.com');
    expect(res.user.roles).toContain('ADMIN');
    expect(res.mustChangePassword).toBe(true);
    expect(mockSupabaseService.signInWithPassword).toHaveBeenCalledWith('admin@anveshakhub.com', 'SupabaseSecretPassword2026!');
    expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'supa_jwt_access_token_123', expect.any(Object));
  });

  // 2. OFFICIAL SUPABASE PASSWORD RECOVERY
  it('2. Password Recovery: Triggers official Supabase Auth recovery API flow with non-leaking message', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

    const res = await authService.forgotPassword('admin@anveshakhub.com');

    expect(res.message).toContain('If an account exists');
    expect(mockSupabaseService.resetPasswordForEmail).toHaveBeenCalledWith('admin@anveshakhub.com');
  });

  // 3. MANDATORY PASSWORD CHANGE & SUPABASE AUTH UPDATING
  it('3. Password Reset: Updates password in Supabase Auth and clears ERP mustChangePassword flag', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(mockAdminUser);
    mockPrismaService.user.update.mockResolvedValue({ ...mockAdminUser, mustChangePassword: false });

    const res = await authService.resetPassword('admin-uuid-001', 'NewSupabaseSecurePassword2026!');

    expect(res.success).toBe(true);
    expect(mockSupabaseService.updateUserPassword).toHaveBeenCalledWith('admin-uuid-001', 'NewSupabaseSecurePassword2026!');
    expect(mockPrismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mustChangePassword: false }),
      }),
    );
  });

  // 4. ADMIN AUTHORIZATION & ROLES GUARD
  it('4. RBAC: RolesGuard grants access to ADMIN role', () => {
    const reflector = new (require('@nestjs/core').Reflector)();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const rolesGuard = new RolesGuard(reflector);
    const mockContextAdmin = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['ADMIN'] } }),
      }),
    } as any;

    expect(rolesGuard.canActivate(mockContextAdmin)).toBe(true);
  });

  // 5. TENANT ORGANIZATION ISOLATION GUARD
  it('5. Tenant Isolation: OrganizationIsolationGuard permits user within matched organization', () => {
    const orgGuard = new OrganizationIsolationGuard();
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles: ['ORG_USER'], organization: { id: 'org-001' } },
          params: { orgId: 'org-001' },
        }),
      }),
    } as any;

    expect(orgGuard.canActivate(mockContext)).toBe(true);
  });

  // 6. PRIVATE DOCUMENT ACCESS & SUPABASE STORAGE SIGNED URLS
  it('6. Storage: Presigned document URLs generated via Supabase Storage Client', async () => {
    mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

    const res = await documentsService.getSignedDownloadUrl('doc-uuid-001', { id: 'admin-uuid-001', roles: ['ADMIN'] });

    expect(res.documentId).toBe('doc-uuid-001');
    expect(res.downloadUrl).toContain('supabase.co/storage');
    expect(mockSupabaseService.storage.from).toHaveBeenCalledWith('anveshak-private-documents');
  });

  // 7. LOGOUT & COOKIE CLEANUP
  it('7. Auth: Logout signs out from Supabase Auth and clears session cookies', async () => {
    const mockResponse = { clearCookie: jest.fn() } as any;

    const res = await authService.logout(mockResponse);

    expect(res.success).toBe(true);
    expect(mockSupabaseService.auth.signOut).toHaveBeenCalled();
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
  });
});
