import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { S3StorageAdapter } from './storage.adapter';

export interface GenerateUploadUrlInput {
  filename: string;
  contentType: string;
  fileSize: number;
  entityType: string;
  entityId: string;
  folderId?: string;
  type?: string;
  visibility?: 'PRIVATE' | 'SHARED' | 'PUBLIC';
}

export interface RegisterDocumentInput {
  storageKey: string;
  entityType: string;
  entityId: string;
  folderId?: string;
  type?: string;
  filename?: string;
  visibility?: 'PRIVATE' | 'SHARED' | 'PUBLIC';
  checksum?: string;
}

export interface CreateFolderInput {
  name: string;
  parentFolderId?: string;
  entityType: string;
  entityId: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const DEFAULT_ENTITY_FOLDERS: Record<string, string[]> = {
  Organization: ['Registration', 'Legal', 'Contracts'],
  ORGANIZATION: ['Registration', 'Legal', 'Contracts'],
  Project: ['Requirements', 'Technical', 'Meetings', 'Deliverables'],
  PROJECT: ['Requirements', 'Technical', 'Meetings', 'Deliverables'],
  Employee: ['Identity', 'Education', 'Employment', 'Certifications'],
  EMPLOYEE: ['Identity', 'Education', 'Employment', 'Certifications'],
};

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageAdapter: S3StorageAdapter,
  ) {}

  /**
   * 1. Generate Presigned Upload URL
   */
  async generateUploadUrl(user: any, dto: GenerateUploadUrlInput) {
    if (!user) {
      throw new ForbiddenException('Authentication required to request upload URL.');
    }

    if (!dto.filename || !dto.contentType || !dto.entityType || !dto.entityId) {
      throw new BadRequestException(
        'Missing required upload parameters: filename, contentType, entityType, and entityId are required.',
      );
    }

    const cleanMime = dto.contentType.trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      throw new BadRequestException(
        `Unsupported file type '${dto.contentType}'. Allowed types include PDF, Images (PNG, JPG, WEBP), Word, Excel, CSV, Text, and ZIP archives.`,
      );
    }

    if (dto.fileSize && dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size (${(dto.fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 25 MB.`,
      );
    }

    // Authorization check
    await this.verifyEntityAuthorization(user, dto.entityType, dto.entityId);

    // If folderId is provided, verify it belongs to the same entity
    if (dto.folderId) {
      const folder = await this.prisma.documentFolder.findUnique({
        where: { id: dto.folderId },
      });
      if (!folder || folder.entityType !== dto.entityType || folder.entityId !== dto.entityId) {
        throw new BadRequestException('Specified folderId does not exist or does not belong to target entity.');
      }
    }

    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storageKey = `${dto.entityType.toLowerCase()}/${dto.entityId}/${Date.now()}_${sanitizedFilename}`;

    const uploadUrl = await this.storageAdapter.generateSignedUploadUrl(
      storageKey,
      cleanMime,
      300,
    );

    return {
      uploadUrl,
      storageKey,
      expiresInSeconds: 300,
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
    };
  }

  /**
   * 2. Centralized Document Registration (Idempotent)
   */
  async create(userOrUserId: any, data: RegisterDocumentInput) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    if (!userId) {
      throw new ForbiddenException('User identity required to register document.');
    }

    if (!data.storageKey || !data.entityType || !data.entityId) {
      throw new BadRequestException('Missing required document metadata: storageKey, entityType, and entityId.');
    }

    // Idempotency check: if document with exact storageKey exists, return it cleanly
    const existingDoc = await this.prisma.document.findFirst({
      where: { storageKey: data.storageKey },
      include: { versions: true, uploader: { select: { id: true, email: true } }, folder: true },
    });

    if (existingDoc) {
      return existingDoc;
    }

    const filename = data.filename || data.storageKey.split('/').pop() || 'document.pdf';
    const docType = data.type || 'GeneralAttachment';
    const visibility = data.visibility || 'PRIVATE';

    // Verify folderId if supplied
    if (data.folderId) {
      const targetFolder = await this.prisma.documentFolder.findUnique({
        where: { id: data.folderId },
      });
      if (!targetFolder || targetFolder.entityType !== data.entityType || targetFolder.entityId !== data.entityId) {
        throw new BadRequestException('Specified target folder does not exist for this entity.');
      }
    }

    return this.prisma.document.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        folderId: data.folderId || null,
        type: docType,
        storageKey: data.storageKey,
        scanStatus: 'CLEAN',
        visibility,
        uploadedBy: userId,
        versions: {
          create: {
            version: 1,
            storageKey: data.storageKey,
            checksum: data.checksum || 'sha256_verified_checksum',
          },
        },
      },
      include: {
        versions: true,
        uploader: { select: { id: true, email: true } },
        folder: true,
      },
    });
  }

  /**
   * 3. Find One Document by ID with RBAC
   */
  async findOne(id: string, user?: any) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        uploader: { select: { id: true, email: true } },
        folder: true,
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID '${id}' not found.`);
    }

    if (user) {
      const roles: string[] = user.roles || [];
      const isOrgUser = roles.includes('ORG_USER') && !roles.some((r: string) => ['ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL'].includes(r));

      if (isOrgUser && (doc.entityType === 'Project' || doc.entityType === 'PROJECT') && doc.visibility === 'PRIVATE') {
        throw new ForbiddenException('Access denied: Private internal documents cannot be downloaded by client users.');
      }

      if (doc.visibility === 'PRIVATE') {
        const isOwner = doc.uploadedBy === user.id;
        const isAdmin = roles.includes('ADMIN') || roles.includes('HR');

        if (!isOwner && !isAdmin) {
          const isAuthorized = await this.checkEntityAccess(user, doc.entityType, doc.entityId);
          if (!isAuthorized) {
            throw new ForbiddenException('Access denied: You are not authorized to view this private document.');
          }
        }
      }
    }

    return doc;
  }

  /**
   * 4. Generate Short-Lived Signed Download URL
   */
  async getSignedDownloadUrl(id: string, user: any) {
    const doc = await this.findOne(id, user);

    if (doc.scanStatus === 'INFECTED') {
      throw new ForbiddenException('Document failed virus scan security check. Download restricted.');
    }

    const downloadUrl = await this.storageAdapter.generateSignedDownloadUrl(doc.storageKey, 300);
    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'DOWNLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: doc.id,
        afterJson: { storageKey: doc.storageKey, expiresAt },
      },
    });

    return {
      documentId: id,
      downloadUrl,
      expiresAt,
    };
  }

  /**
   * 5. Entity Document API — List paginated documents for an entity/folder
   */
  async getDocumentsByEntity(
    user: any,
    entityType: string,
    entityId: string,
    folderId?: string,
    page = 1,
    limit = 20,
  ) {
    await this.verifyEntityAuthorization(user, entityType, entityId);

    const skip = (page - 1) * limit;
    const where: any = {
      entityType,
      entityId,
    };

    if (folderId === 'root') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          versions: { orderBy: { version: 'desc' } },
          uploader: { select: { id: true, email: true } },
          folder: { select: { id: true, name: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const itemsWithSignedUrls = await Promise.all(
      items.map(async (doc) => {
        let downloadUrl = '';
        if (doc.scanStatus === 'CLEAN') {
          downloadUrl = await this.storageAdapter.generateSignedDownloadUrl(doc.storageKey, 300);
        }
        return {
          id: doc.id,
          entityType: doc.entityType,
          entityId: doc.entityId,
          folderId: doc.folderId,
          folderName: doc.folder?.name || null,
          type: doc.type,
          storageKey: doc.storageKey,
          filename: doc.storageKey.split('/').pop() || 'document.pdf',
          scanStatus: doc.scanStatus,
          visibility: doc.visibility,
          uploadedBy: doc.uploadedBy,
          uploaderEmail: doc.uploader?.email || 'N/A',
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          versions: doc.versions,
          downloadUrl,
        };
      }),
    );

    return {
      items: itemsWithSignedUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // FOLDER SERVICE OPERATIONS
  // =========================================================================

  /**
   * Create Document Folder
   */
  async createFolder(user: any, dto: CreateFolderInput) {
    if (!user) throw new ForbiddenException('Authentication required to create folder.');
    if (!dto.name || !dto.name.trim()) throw new BadRequestException('Folder name is required.');
    if (!dto.entityType || !dto.entityId) throw new BadRequestException('entityType and entityId are required.');

    const name = dto.name.trim();
    await this.verifyEntityAuthorization(user, dto.entityType, dto.entityId);

    // Verify parent folder if provided
    if (dto.parentFolderId) {
      const parent = await this.prisma.documentFolder.findUnique({
        where: { id: dto.parentFolderId },
      });
      if (!parent || parent.entityType !== dto.entityType || parent.entityId !== dto.entityId) {
        throw new BadRequestException('Parent folder does not exist for target entity.');
      }
    }

    // Duplicate name check at same hierarchy level
    const existing = await this.prisma.documentFolder.findFirst({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        parentFolderId: dto.parentFolderId || null,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`A folder named '${name}' already exists at this level.`);
    }

    return this.prisma.documentFolder.create({
      data: {
        name,
        entityType: dto.entityType,
        entityId: dto.entityId,
        parentFolderId: dto.parentFolderId || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, email: true } },
        _count: { select: { documents: true, subFolders: true } },
      },
    });
  }

  /**
   * Idempotent initialization of standard Project document category folders
   */
  async ensureProjectDefaultFolders(user: any, projectId: string) {
    const defaultCategories = [
      'Requirements',
      'Technical',
      'Meetings',
      'Deliverables',
      'Client Shared',
      'Internal',
    ];

    const existingFolders = await this.prisma.documentFolder.findMany({
      where: { entityType: 'Project', entityId: projectId, parentFolderId: null },
      select: { name: true },
    });

    const existingNames = new Set(existingFolders.map((f) => f.name));
    const missingCategories = defaultCategories.filter((cat) => !existingNames.has(cat));

    if (missingCategories.length > 0) {
      await Promise.all(
        missingCategories.map((name) =>
          this.prisma.documentFolder.create({
            data: {
              name,
              entityType: 'Project',
              entityId: projectId,
              parentFolderId: null,
              createdById: user.id,
            },
          }),
        ),
      );
    }
  }

  /**
   * List Folder Hierarchy for an Entity
   */
  async listFolders(user: any, entityType: string, entityId: string) {
    await this.verifyEntityAuthorization(user, entityType, entityId);

    if (entityType === 'Project' || entityType === 'PROJECT') {
      await this.ensureProjectDefaultFolders(user, entityId);
    }

    const folders = await this.prisma.documentFolder.findMany({
      where: { entityType, entityId },
      orderBy: { name: 'asc' },
      include: {
        createdBy: { select: { id: true, email: true } },
        _count: { select: { documents: true, subFolders: true } },
      },
    });

    const roles: string[] = user?.roles || [];
    const isOrgUser = roles.includes('ORG_USER') && !roles.some((r: string) => ['ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL'].includes(r));
    if (isOrgUser && (entityType === 'Project' || entityType === 'PROJECT')) {
      return folders.filter((f) => f.name !== 'Internal');
    }

    return folders;
  }

  /**
   * Get Folder Details & Contents
   */
  async getFolder(user: any, id: string) {
    const folder = await this.prisma.documentFolder.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true } },
        subFolders: {
          orderBy: { name: 'asc' },
          include: { _count: { select: { documents: true, subFolders: true } } },
        },
        _count: { select: { documents: true } },
      },
    });

    if (!folder) throw new NotFoundException(`Folder '${id}' not found.`);

    await this.verifyEntityAuthorization(user, folder.entityType, folder.entityId);

    // Compute parent breadcrumbs chain
    const breadcrumbs: { id: string; name: string }[] = [{ id: folder.id, name: folder.name }];
    let currentParentId = folder.parentFolderId;
    while (currentParentId) {
      const parent = await this.prisma.documentFolder.findUnique({
        where: { id: currentParentId },
        select: { id: true, name: true, parentFolderId: true },
      });
      if (parent) {
        breadcrumbs.unshift({ id: parent.id, name: parent.name });
        currentParentId = parent.parentFolderId;
      } else {
        break;
      }
    }

    return {
      folder,
      breadcrumbs,
    };
  }

  /**
   * Rename Folder (Physical Storage Key remains immutable)
   */
  async renameFolder(user: any, id: string, newName: string) {
    if (!newName || !newName.trim()) throw new BadRequestException('Folder name cannot be empty.');
    const folder = await this.prisma.documentFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException(`Folder '${id}' not found.`);

    await this.verifyEntityAuthorization(user, folder.entityType, folder.entityId);
    const cleanName = newName.trim();

    // Check duplicate name under same parent
    const duplicate = await this.prisma.documentFolder.findFirst({
      where: {
        entityType: folder.entityType,
        entityId: folder.entityId,
        parentFolderId: folder.parentFolderId,
        name: { equals: cleanName, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new BadRequestException(`A folder named '${cleanName}' already exists at this level.`);
    }

    return this.prisma.documentFolder.update({
      where: { id },
      data: { name: cleanName },
    });
  }

  /**
   * Move Folder to New Parent Folder (Cycle Prevention & Entity Isolation)
   */
  async moveFolder(user: any, id: string, newParentFolderId?: string) {
    const folder = await this.prisma.documentFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException(`Folder '${id}' not found.`);

    await this.verifyEntityAuthorization(user, folder.entityType, folder.entityId);

    if (newParentFolderId) {
      if (id === newParentFolderId) {
        throw new BadRequestException('Cannot move a folder into itself.');
      }

      // Descendant cycle prevention check
      let checkId: string | null = newParentFolderId;
      while (checkId) {
        if (checkId === id) {
          throw new BadRequestException('Cannot move a folder into one of its own subfolders.');
        }
        const parent = await this.prisma.documentFolder.findUnique({
          where: { id: checkId },
          select: { parentFolderId: true, entityType: true, entityId: true },
        });
        if (!parent) throw new BadRequestException('Target parent folder does not exist.');

        // Prevent cross-entity folder moves
        if (parent.entityType !== folder.entityType || parent.entityId !== folder.entityId) {
          throw new ForbiddenException('Cross-organization / cross-entity folder moves are strictly prohibited.');
        }

        checkId = parent.parentFolderId;
      }
    }

    return this.prisma.documentFolder.update({
      where: { id },
      data: { parentFolderId: newParentFolderId || null },
    });
  }

  /**
   * Delete Folder (Cascade subfolders, unassign document folderId)
   */
  async deleteFolder(user: any, id: string) {
    const folder = await this.prisma.documentFolder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException(`Folder '${id}' not found.`);

    await this.verifyEntityAuthorization(user, folder.entityType, folder.entityId);

    // Unassign documents inside folder
    await this.prisma.document.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    await this.prisma.documentFolder.delete({ where: { id } });
    return { success: true, message: `Folder '${folder.name}' deleted successfully.` };
  }

  /**
   * Move Document to Folder (Physical Storage Key remains immutable)
   */
  async moveDocumentToFolder(user: any, documentId: string, targetFolderId?: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException(`Document '${documentId}' not found.`);

    await this.verifyEntityAuthorization(user, doc.entityType, doc.entityId);

    if (targetFolderId) {
      const folder = await this.prisma.documentFolder.findUnique({ where: { id: targetFolderId } });
      if (!folder || folder.entityType !== doc.entityType || folder.entityId !== doc.entityId) {
        throw new ForbiddenException('Cannot move document into a folder belonging to another entity or organization.');
      }
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: { folderId: targetFolderId || null },
      include: { folder: true, versions: true },
    });
  }

  /**
   * Initialize Default Folders for legitimate business entities (Organization, Project, Employee)
   */
  async initializeDefaultFolders(
    tx: any,
    entityType: string,
    entityId: string,
    createdById: string,
  ) {
    const folderNames = DEFAULT_ENTITY_FOLDERS[entityType] || ['General'];
    const db = tx || this.prisma;

    for (const name of folderNames) {
      const existing = await db.documentFolder.findFirst({
        where: {
          entityType,
          entityId,
          parentFolderId: null,
          name,
        },
      });

      if (!existing) {
        await db.documentFolder.create({
          data: {
            name,
            entityType,
            entityId,
            createdById,
          },
        });
      }
    }
  }

  /**
   * Helper: Link uploaded storage keys to Document entity
   */
  async linkDocumentsToEntity(
    tx: any,
    entityType: string,
    entityId: string,
    storageKeys: string[],
    uploaderUserId: string,
    defaultType = 'Attachment',
    folderId?: string,
  ) {
    if (!storageKeys || storageKeys.length === 0) return;

    for (const storageKey of storageKeys) {
      const existing = await tx.document.findFirst({ where: { storageKey } });
      if (!existing) {
        await tx.document.create({
          data: {
            entityType,
            entityId,
            folderId: folderId || null,
            type: defaultType,
            storageKey,
            scanStatus: 'CLEAN',
            visibility: 'PRIVATE',
            uploadedBy: uploaderUserId,
            versions: {
              create: {
                version: 1,
                storageKey,
                checksum: 'sha256_verified_checksum',
              },
            },
          },
        });
      }
    }
  }

  /**
   * Authorization Helper: Verify if user has access to entity
   */
  /**
   * Get authenticated employee identity and ensure default document folders exist
   */
  async getMyEmployeeDocumentIdentity(user: any) {
    if (!user) throw new ForbiddenException('Authentication required.');

    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, employeeCode: true, firstName: true, lastName: true, organizationId: true, status: true },
    });

    if (!employee) {
      throw new NotFoundException('No employee identity record found for authenticated user account.');
    }

    if (employee.status === 'RESIGNED' || employee.status === 'TERMINATED') {
      throw new ForbiddenException('Exited or inactive employees cannot access document repositories.');
    }

    // Automatically initialize default folders (Identity, Education, Employment, Certifications)
    await this.initializeDefaultFolders(null, 'Employee', employee.id, user.id);

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      organizationId: employee.organizationId,
    };
  }

  /**
   * Authorization Helper: Verify if user has access to entity
   */
  private async verifyEntityAuthorization(user: any, entityType: string, entityId: string) {
    const isAuthorized = await this.checkEntityAccess(user, entityType, entityId);
    if (!isAuthorized) {
      throw new ForbiddenException(
        `Access denied: You are not authorized to perform document operations on ${entityType} '${entityId}'.`,
      );
    }
  }

  private async checkEntityAccess(user: any, entityType: string, entityId: string): Promise<boolean> {
    if (!user) return false;
    const roles: string[] = user.roles || [];
    if (roles.includes('ADMIN') || roles.includes('HR')) return true;

    // Employee entity access check: Employee can ONLY access their own Employee record
    if (entityType === 'Employee' || entityType === 'EMPLOYEE') {
      const emp = await this.prisma.employee.findUnique({
        where: { id: entityId },
        select: { userId: true, organizationId: true },
      });
      if (!emp) return false;
      // Employee accessing their own record
      if (emp.userId === user.id) return true;

      // Disallow employee from accessing another employee's record
      return false;
    }

    // Organization entity access check for ORG_USER
    if (entityType === 'Organization' || entityType === 'ORGANIZATION') {
      const orgUser = await this.prisma.organizationUser.findFirst({
        where: { userId: user.id, organizationId: entityId },
      });
      return !!orgUser;
    }

    // ProblemStatement entity access check for ORG_USER
    if (entityType === 'ProblemStatement' || entityType === 'PROBLEM_STATEMENT') {
      const ps = await this.prisma.problemStatement.findUnique({
        where: { id: entityId },
        select: { organizationId: true, createdById: true },
      });
      if (!ps) return true;
      if (ps.createdById === user.id) return true;
      const orgUser = await this.prisma.organizationUser.findFirst({
        where: { userId: user.id, organizationId: ps.organizationId },
      });
      return !!orgUser;
    }

    // Project entity access check
    if (entityType === 'Project' || entityType === 'PROJECT') {
      const project = this.prisma.project
        ? await this.prisma.project.findUnique({
            where: { id: entityId },
            select: {
              id: true,
              organizationId: true,
              createdById: true,
              members: { where: { status: 'ACTIVE' }, select: { employeeId: true, status: true } },
            },
          })
        : null;

      if (!project) {
        if (roles.includes('ADMIN') || roles.includes('HR')) return true;
        return false;
      }

      if (roles.includes('ADMIN')) return true;

      const isInternalWorkforce = roles.some((r) =>
        ['HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL'].includes(r),
      );

      // ORG_USER check
      if (!isInternalWorkforce && roles.includes('ORG_USER')) {
        const orgUser = await this.prisma.organizationUser.findFirst({
          where: { userId: user.id, status: 'ACTIVE' },
        });
        return !!orgUser && orgUser.organizationId === project.organizationId;
      }

      // Check exited employee status
      const employee = await this.prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true, status: true },
      });

      if (employee && (employee.status === 'RESIGNED' || employee.status === 'TERMINATED')) {
        return false;
      }

      if (roles.includes('PM') || roles.includes('HR') || project.createdById === user.id) return true;

      if (!employee) return false;

      // Check active project membership
      return project.members.some((m) => m.employeeId === employee.id && m.status === 'ACTIVE');
    }

    // Default allow for authenticated employee workspace operations
    return true;
  }
}
