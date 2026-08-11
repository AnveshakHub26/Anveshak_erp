import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BusinessVerticalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.businessVertical.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByCode(code: string) {
    return this.prisma.businessVertical.findUnique({
      where: { code },
    });
  }
}
