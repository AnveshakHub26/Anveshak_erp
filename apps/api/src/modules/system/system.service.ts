import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Organization' | 'User' | 'Document';
  type: string;
  url: string;
}

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async createSupportRequest(data: {
    category: string;
    subject: string;
    message: string;
    contactEmail?: string;
    actorUserId?: string;
  }) {
    const ticketId = `SUP-${Date.now().toString().slice(-6)}`;

    // Create security audit log for persistent support request tracking
    await this.prisma.auditLog.create({
      data: {
        actorUserId: data.actorUserId || null,
        action: 'SUBMIT_SUPPORT_REQUEST',
        entityType: 'SUPPORT_TICKET',
        entityId: ticketId,
        afterJson: {
          category: data.category,
          subject: data.subject,
          contactEmail: data.contactEmail,
        },
      },
    });

    return {
      ticketId,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
  }

  async globalSearch(query: string, user: any, category = 'all'): Promise<SearchResultItem[]> {
    const q = query.trim();
    if (!q || q.length < 2) {
      return [];
    }

    const results: SearchResultItem[] = [];
    const roles: string[] = user?.roles || [];

    // 1. Search Organizations
    if (category === 'all' || category === 'organizations') {
      const orgWhere: any = {
        OR: [
          { legalName: { contains: q, mode: 'insensitive' } },
          { orgNumber: { contains: q, mode: 'insensitive' } },
          { tradeName: { contains: q, mode: 'insensitive' } },
        ],
      };

      // Organization boundary restriction for ORG_USER
      if (roles.includes('ORG_USER') && !roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN')) {
        orgWhere.id = user.organizationId;
      }

      const orgs = await this.prisma.organization.findMany({
        where: orgWhere,
        take: 10,
        select: { id: true, orgNumber: true, legalName: true, status: true },
      });

      for (const org of orgs) {
        results.push({
          id: org.id,
          title: org.legalName,
          subtitle: `Identifier: ${org.orgNumber} • Status: ${org.status}`,
          category: 'Organization',
          type: 'Canonical Organization',
          url: `/organizations/${org.id}`,
        });
      }
    }

    // 2. Search Users (Restricted to SUPER_ADMIN, ADMIN, HR)
    if (category === 'all' || category === 'users') {
      if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('HR')) {
        const users = await this.prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 10,
          select: { id: true, email: true, status: true },
        });

        for (const u of users) {
          results.push({
            id: u.id,
            title: u.email,
            subtitle: `Account Status: ${u.status}`,
            category: 'User',
            type: 'User Account',
            url: `/admin/users/${u.id}`,
          });
        }
      }
    }

    // 3. Search Documents
    if (category === 'all' || category === 'documents') {
      const docWhere: any = {
        OR: [
          { type: { contains: q, mode: 'insensitive' } },
          { storageKey: { contains: q, mode: 'insensitive' } },
        ],
      };

      if (!roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN')) {
        docWhere.OR = [
          { uploadedById: user.id },
          { visibility: 'PUBLIC' },
        ];
      }

      const docs = await this.prisma.document.findMany({
        where: docWhere,
        take: 10,
        select: { id: true, type: true, storageKey: true, visibility: true },
      });

      for (const doc of docs) {
        results.push({
          id: doc.id,
          title: doc.type,
          subtitle: `Storage Key: ${doc.storageKey} • Visibility: ${doc.visibility}`,
          category: 'Document',
          type: 'System Document',
          url: `/documents/${doc.id}`,
        });
      }
    }

    return results;
  }

  async checkHealth() {
    let dbStatus = 'HEALTHY';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'FAILED';
    }

    return {
      status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus },
        api: { status: 'HEALTHY' },
        redis: { status: 'HEALTHY' },
      },
    };
  }

  async getSettings() {
    return this.prisma.systemSetting.findMany();
  }
}
