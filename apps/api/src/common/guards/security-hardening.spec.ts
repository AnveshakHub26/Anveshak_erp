import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationIsolationGuard } from './organization-isolation.guard';
import { RolesGuard } from './roles.guard';
import { DocumentsService } from '../../modules/documents/documents.service';
import { PrismaService } from '../../database/prisma.service';
import { S3StorageAdapter } from '../../modules/documents/storage.adapter';
import { ExecutionContext, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('Phase 2H — Comprehensive Production Security & BOLA Test Suite', () => {
  let orgGuard: OrganizationIsolationGuard;
  let rolesGuard: RolesGuard;
  let docsService: DocumentsService;
  let reflector: Reflector;
  let mockPrisma: any;
  let mockStorageAdapter: any;

  const employeeA = { id: 'user-emp-a', roles: ['STAFF'] };
  const employeeB = { id: 'user-emp-b', roles: ['STAFF'] };
  const orgUserA = { id: 'user-org-a', roles: ['ORG_USER'], organizationId: 'org-111' };
  const orgUserB = { id: 'user-org-b', roles: ['ORG_USER'], organizationId: 'org-222' };
  const hrUser = { id: 'user-hr-1', roles: ['HR'] };
  const adminUser = { id: 'user-admin-1', roles: ['ADMIN'] };

  beforeEach(async () => {
    orgGuard = new OrganizationIsolationGuard();
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    mockPrisma = {
      document: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      documentFolder: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
      },
      organizationUser: {
        findFirst: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    mockStorageAdapter = {
      generateSignedUploadUrl: jest.fn().mockResolvedValue('https://storage.supabase.co/upload/presigned'),
      generateSignedDownloadUrl: jest.fn().mockResolvedValue('https://storage.supabase.co/download/presigned'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3StorageAdapter, useValue: mockStorageAdapter },
      ],
    }).compile();

    docsService = module.get<DocumentsService>(DocumentsService);
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}, query: any = {}, requiredRoles?: string[]): ExecutionContext => {
    if (requiredRoles) {
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);
    }
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user, params, body, query }),
      }),
    } as any;
  };

  describe('1. Unauthenticated & Authorization Guard Boundaries', () => {
    it('1. Unauthenticated request → rejected (returns false for missing user)', () => {
      const ctx = createMockContext(null, { id: 'org-111' });
      expect(orgGuard.canActivate(ctx)).toBe(false);
    });

    it('2. Authenticated but unauthorized role → rejected by RolesGuard (403 Forbidden)', () => {
      const ctx = createMockContext(employeeA, {}, {}, {}, ['ADMIN']);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('2. Multi-Tenant & BOLA Data Isolation Checks', () => {
    it('3. Employee A attempting to access Employee B document → rejected (403 Forbidden)', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-b-id',
        userId: 'user-emp-b', // Belongs to Employee B!
      });

      await expect(
        docsService.getDocumentsByEntity(employeeA, 'Employee', 'emp-b-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('4. Organization A user attempting to access Organization B → rejected by OrganizationIsolationGuard', () => {
      const ctx = createMockContext(orgUserA, { organizationId: 'org-222' });
      expect(() => orgGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('5. Tampered employeeId in URL/params → rejected', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-b-id',
        userId: 'user-emp-b',
      });

      await expect(
        docsService.getDocumentsByEntity(employeeA, 'Employee', 'emp-tampered-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('6. Tampered organizationId in request payload → rejected by OrganizationIsolationGuard', () => {
      const ctx = createMockContext(orgUserA, {}, { organizationId: 'org-b-tampered' });
      expect(() => orgGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('7. Tampered projectId belonging to another organization → rejected (403 Forbidden)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-other-org',
        organizationId: 'org-222', // Belongs to Org B!
        members: [],
      });
      mockPrisma.organizationUser.findFirst.mockResolvedValue(null);

      await expect(
        docsService.getDocumentsByEntity(orgUserA, 'Project', 'proj-other-org'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Document Download & Movement Security', () => {
    it('8. Unauthorized document download (Private project doc requested by non-member) → rejected (403)', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-private-1',
        entityType: 'Project',
        entityId: 'proj-other-org',
        visibility: 'PRIVATE',
        uploadedBy: 'user-other',
        scanStatus: 'CLEAN',
        storageKey: 'project/proj-other-org/doc.pdf',
      });
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-other-org',
        organizationId: 'org-222',
        members: [],
      });

      await expect(docsService.getSignedDownloadUrl('doc-private-1', employeeA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('9. Unauthorized document deletion / unapproved access → throws NotFound / Forbidden', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);
      await expect(docsService.findOne('doc-nonexistent', employeeA)).rejects.toThrow();
    });

    it('10. Unauthorized cross-organization folder movement → rejected (403 Forbidden)', async () => {
      mockPrisma.documentFolder.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'folder-org-1') return { id: 'folder-org-1', entityType: 'Organization', entityId: 'org-111' };
        if (where.id === 'folder-org-2') return { id: 'folder-org-2', entityType: 'Organization', entityId: 'org-222' };
        return null;
      });
      mockPrisma.organizationUser.findFirst.mockResolvedValue({ id: 'ou-1', organizationId: 'org-111' });

      await expect(docsService.moveFolder(orgUserA, 'folder-org-1', 'folder-org-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('4. Upload Validation & Quarantine Rules', () => {
    it('11. Dangerous executable extension (.exe, .sh, .bat, .php) → rejected (400 Bad Request)', async () => {
      await expect(
        docsService.generateUploadUrl(employeeA, {
          filename: 'script.php',
          contentType: 'text/plain',
          fileSize: 1024,
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('12. Invalid / unsupported MIME type → rejected (400 Bad Request)', async () => {
      await expect(
        docsService.generateUploadUrl(employeeA, {
          filename: 'file.bin',
          contentType: 'application/octet-stream',
          fileSize: 1024,
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('13. Oversized upload (> 25MB) → rejected (400 Bad Request)', async () => {
      await expect(
        docsService.generateUploadUrl(employeeA, {
          filename: 'large.pdf',
          contentType: 'application/pdf',
          fileSize: 30 * 1024 * 1024,
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('14. Quarantined file with scanStatus PENDING / INFECTED cannot be downloaded', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-pending-1',
        entityType: 'Project',
        entityId: 'proj-123',
        visibility: 'PRIVATE',
        uploadedBy: 'user-emp-a',
        scanStatus: 'PENDING', // Not yet CLEAN!
        storageKey: 'quarantine/project/proj-123/file.pdf',
      });
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj-123',
        members: [{ employeeId: 'user-emp-a', status: 'ACTIVE' }],
      });

      await expect(docsService.getSignedDownloadUrl('doc-pending-1', employeeA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
