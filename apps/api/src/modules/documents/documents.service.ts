import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { S3StorageAdapter } from './storage.adapter';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageAdapter: S3StorageAdapter,
  ) {}

  async findOne(id: string, user?: any) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        uploader: { select: { id: true, email: true } },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found.`);
    }

    // Verify user authorization for private documents
    if (user && doc.visibility === 'PRIVATE') {
      const roles: string[] = user.roles || [];
      const isOwner = doc.uploadedBy === user.id;
      const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Access denied: You are not authorized to access this private document.');
      }
    }

    return doc;
  }

  async getSignedDownloadUrl(id: string, user: any) {
    const doc = await this.findOne(id, user);

    if (doc.scanStatus === 'INFECTED') {
      throw new ForbiddenException('Document failed virus scan security check.');
    }

    // Generate real AWS S3 / MinIO signed URL (valid for 5 minutes)
    const downloadUrl = await this.storageAdapter.generateSignedDownloadUrl(doc.storageKey, 300);
    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();

    // Log document download access event in audit logs
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

  async create(data: {
    entityType: string;
    entityId: string;
    type: string;
    filename: string;
    uploadedBy: string;
  }) {
    const storageKey = `${data.entityType.toLowerCase()}/${data.entityId}/${Date.now()}_${data.filename}`;

    return this.prisma.document.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        type: data.type,
        storageKey,
        scanStatus: 'CLEAN',
        visibility: 'PRIVATE',
        uploadedBy: data.uploadedBy,
        versions: {
          create: {
            version: 1,
            storageKey,
            checksum: 'sha256_mock_checksum',
          },
        },
      },
      include: { versions: true },
    });
  }
}
