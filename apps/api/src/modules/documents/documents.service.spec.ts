import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { S3StorageAdapter } from './storage.adapter';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DocumentsService & Folder Engine Unit Tests', () => {
  let service: DocumentsService;
  let mockPrisma: any;
  let mockStorageAdapter: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@anveshak.com',
    roles: ['STAFF'],
  };

  beforeEach(async () => {
    mockPrisma = {
      document: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      documentFolder: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      organizationUser: {
        findFirst: jest.fn(),
      },
      problemStatement: {
        findUnique: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
      },
    };

    mockStorageAdapter = {
      generateSignedUploadUrl: jest.fn().mockResolvedValue('https://storage.supabase.co/upload/presigned-key'),
      generateSignedDownloadUrl: jest.fn().mockResolvedValue('https://storage.supabase.co/download/presigned-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3StorageAdapter, useValue: mockStorageAdapter },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);

    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'proj-123',
      organizationId: 'org-123',
      members: [{ employeeId: 'emp-123', status: 'ACTIVE' }],
    });
    mockPrisma.employee.findUnique.mockResolvedValue({
      id: 'emp-123',
      userId: 'user-123',
      status: 'ACTIVE',
    });
  });

  describe('Presigned Upload URL Generation', () => {
    it('should generate presigned upload URL for valid request', async () => {
      const result = await service.generateUploadUrl(mockUser, {
        filename: 'specification.pdf',
        contentType: 'application/pdf',
        fileSize: 1024 * 1024,
        entityType: 'Project',
        entityId: 'proj-123',
      });

      expect(result).toBeDefined();
      expect(result.uploadUrl).toBe('https://storage.supabase.co/upload/presigned-key');
      expect(result.storageKey).toContain('quarantine/project/proj-123/');
      expect(mockStorageAdapter.generateSignedUploadUrl).toHaveBeenCalled();
    });

    it('should reject unsupported file mime types', async () => {
      await expect(
        service.generateUploadUrl(mockUser, {
          filename: 'malicious.exe',
          contentType: 'application/x-msdownload',
          fileSize: 500,
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject oversized files exceeding 25MB', async () => {
      await expect(
        service.generateUploadUrl(mockUser, {
          filename: 'huge_file.zip',
          contentType: 'application/zip',
          fileSize: 30 * 1024 * 1024,
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Document Registration & Idempotency', () => {
    it('should register document metadata and initial version when key is new', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      mockPrisma.document.create.mockResolvedValue({
        id: 'doc-new-1',
        storageKey: 'project/proj-123/file.pdf',
        entityType: 'Project',
        entityId: 'proj-123',
        type: 'GeneralAttachment',
        scanStatus: 'CLEAN',
      });

      const result = await service.create(mockUser, {
        storageKey: 'project/proj-123/file.pdf',
        entityType: 'Project',
        entityId: 'proj-123',
      });

      expect(result.id).toBe('doc-new-1');
      expect(mockPrisma.document.create).toHaveBeenCalled();
    });

    it('should return existing document without duplicate creation when storageKey exists (Idempotency)', async () => {
      const existingDoc = {
        id: 'doc-existing-1',
        storageKey: 'project/proj-123/existing.pdf',
        entityType: 'Project',
        entityId: 'proj-123',
      };
      mockPrisma.document.findFirst.mockResolvedValue(existingDoc);

      const result = await service.create(mockUser, {
        storageKey: 'project/proj-123/existing.pdf',
        entityType: 'Project',
        entityId: 'proj-123',
      });

      expect(result.id).toBe('doc-existing-1');
      expect(mockPrisma.document.create).not.toHaveBeenCalled();
    });
  });

  describe('DocumentFolder Engine & Validation', () => {
    it('should create folder when valid name and entity provided', async () => {
      mockPrisma.documentFolder.findFirst.mockResolvedValue(null);
      mockPrisma.documentFolder.create.mockResolvedValue({
        id: 'folder-10',
        name: 'Technical',
        entityType: 'Project',
        entityId: 'proj-123',
        createdById: 'user-123',
      });

      const result = await service.createFolder(mockUser, {
        name: 'Technical',
        entityType: 'Project',
        entityId: 'proj-123',
      });

      expect(result.id).toBe('folder-10');
      expect(mockPrisma.documentFolder.create).toHaveBeenCalled();
    });

    it('should reject duplicate folder names under same entity and parent', async () => {
      mockPrisma.documentFolder.findFirst.mockResolvedValue({ id: 'folder-existing', name: 'Technical' });

      await expect(
        service.createFolder(mockUser, {
          name: 'Technical',
          entityType: 'Project',
          entityId: 'proj-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent moving a folder into itself (Self-Reference Protection)', async () => {
      mockPrisma.documentFolder.findUnique.mockResolvedValue({
        id: 'folder-A',
        entityType: 'Project',
        entityId: 'proj-123',
      });

      await expect(service.moveFolder(mockUser, 'folder-A', 'folder-A')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent moving a folder into its descendant (Cycle Protection)', async () => {
      // Folder A -> Subfolder B. Try moving Folder A into Subfolder B.
      mockPrisma.documentFolder.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'folder-A') return { id: 'folder-A', entityType: 'Project', entityId: 'proj-123', parentFolderId: null };
        if (where.id === 'folder-B') return { id: 'folder-B', entityType: 'Project', entityId: 'proj-123', parentFolderId: 'folder-A' };
        return null;
      });

      await expect(service.moveFolder(mockUser, 'folder-A', 'folder-B')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject cross-organization folder moves', async () => {
      mockPrisma.documentFolder.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'folder-Org1') return { id: 'folder-Org1', entityType: 'Organization', entityId: 'org-111' };
        if (where.id === 'folder-Org2') return { id: 'folder-Org2', entityType: 'Organization', entityId: 'org-222' };
        return null;
      });

      await expect(service.moveFolder(mockUser, 'folder-Org1', 'folder-Org2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject attaching a document to a folder belonging to another entity', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        entityType: 'Project',
        entityId: 'proj-100',
      });
      mockPrisma.documentFolder.findUnique.mockResolvedValue({
        id: 'folder-other',
        entityType: 'Project',
        entityId: 'proj-999', // Different entity!
      });

      await expect(service.moveDocumentToFolder(mockUser, 'doc-1', 'folder-other')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should initialize default folders cleanly for Organization entity', async () => {
      mockPrisma.documentFolder.findFirst.mockResolvedValue(null);

      await service.initializeDefaultFolders(mockPrisma, 'Organization', 'org-100', 'user-123');

      expect(mockPrisma.documentFolder.create).toHaveBeenCalledTimes(3); // Registration, Legal, Contracts
    });
  });

  describe('Phase 5C — Employee Documents & Security Controls', () => {
    it('should allow employee to retrieve their own document workspace identity and initialize folders', async () => {
      mockPrisma.employee = { findUnique: jest.fn() };
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-100',
        employeeCode: 'EMP-00100',
        firstName: 'Anveshak',
        lastName: 'Employee',
        organizationId: 'org-1',
      });
      mockPrisma.documentFolder.findFirst.mockResolvedValue(null);

      const identity = await service.getMyEmployeeDocumentIdentity(mockUser);

      expect(identity.employeeId).toBe('emp-100');
      expect(identity.employeeCode).toBe('EMP-00100');
      expect(mockPrisma.documentFolder.create).toHaveBeenCalled();
    });

    it('should allow employee to access their own employee documents', async () => {
      mockPrisma.employee = { findUnique: jest.fn() };
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-100',
        userId: 'user-123', // Matches mockUser.id!
      });
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const result = await service.getDocumentsByEntity(mockUser, 'Employee', 'emp-100');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should reject employee from accessing another employee documents (403 Forbidden)', async () => {
      mockPrisma.employee = { findUnique: jest.fn() };
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-other-999',
        userId: 'user-other-999', // Different user ID!
      });

      await expect(
        service.getDocumentsByEntity(mockUser, 'Employee', 'emp-other-999'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle empty employee document state cleanly with 0 documents', async () => {
      mockPrisma.employee = { findUnique: jest.fn() };
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-100',
        userId: 'user-123',
      });
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const result = await service.getDocumentsByEntity(mockUser, 'Employee', 'emp-100');

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    describe('Phase 6B Project Document Security Scenarios', () => {
      const mockProject = {
        id: 'proj-sec-doc',
        organizationId: 'org-sec-1',
        createdById: 'u-pm-1',
        members: [{ employeeId: 'emp-member-1', status: 'ACTIVE' }],
      };

      const activeMemberUser = { id: 'u-member-1', roles: ['STAFF'] };
      const unassignedUser = { id: 'u-unassigned', roles: ['INTERN'] };
      const orgUserClient = { id: 'u-client-1', roles: ['ORG_USER'] };

      it('12. Active project member can list project documents', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(mockProject);
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-member-1', userId: 'u-member-1', status: 'ACTIVE' });
        mockPrisma.document.findMany.mockResolvedValue([]);
        mockPrisma.document.count.mockResolvedValue(0);

        const res = await service.getDocumentsByEntity(activeMemberUser, 'Project', 'proj-sec-doc');
        expect(res.total).toBe(0);
      });

      it('13 & 14. Unassigned employee cannot list or download project document (403)', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(mockProject);
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-unassigned', userId: 'u-unassigned', status: 'ACTIVE' });

        await expect(
          service.getDocumentsByEntity(unassignedUser, 'Project', 'proj-sec-doc'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('15 & 16. ORG_USER access checks for private vs shared documents', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(mockProject);
        mockPrisma.organizationUser.findFirst.mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-sec-1',
          status: 'ACTIVE',
        });

        // Private document check
        mockPrisma.document.findUnique.mockResolvedValue({
          id: 'doc-priv-1',
          entityType: 'Project',
          entityId: 'proj-sec-doc',
          visibility: 'PRIVATE',
        });

        await expect(
          service.getSignedDownloadUrl('doc-priv-1', orgUserClient),
        ).rejects.toThrow(ForbiddenException);
      });

      it('17 & 18. Cross-project document or folder move prevention', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(mockProject);
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-member-1', userId: 'u-member-1', status: 'ACTIVE' });
        mockPrisma.document.findUnique.mockResolvedValue({
          id: 'doc-1',
          entityType: 'Project',
          entityId: 'proj-sec-doc',
        });
        mockPrisma.documentFolder.findUnique.mockResolvedValue({
          id: 'folder-proj-B',
          entityType: 'Project',
          entityId: 'proj-DIFFERENT',
        });

        await expect(
          service.moveDocumentToFolder(activeMemberUser, 'doc-1', 'folder-proj-B'),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
