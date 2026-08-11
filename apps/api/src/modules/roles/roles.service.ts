import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: { active: true },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }
}
