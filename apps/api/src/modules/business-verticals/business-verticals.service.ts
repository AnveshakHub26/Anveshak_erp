import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const OFFICIAL_VERTICALS = [
  { code: 'BV-01', name: 'Research-led Projects', sortOrder: 1 },
  { code: 'BV-02', name: 'IP and Knowledge Management', sortOrder: 2 },
  { code: 'BV-03', name: 'Startup Ecosystem', sortOrder: 3 },
  { code: 'BV-04', name: 'Consulting', sortOrder: 4 },
  { code: 'BV-05', name: 'Design and Development', sortOrder: 5 },
  { code: 'BV-06', name: 'Upskilling and Workshops', sortOrder: 6 },
];

@Injectable()
export class BusinessVerticalsService {
  constructor(private prisma: PrismaService) {}

  async ensureDefaultVerticals() {
    const count = await this.prisma.businessVertical.count();
    if (count === 0) {
      for (const v of OFFICIAL_VERTICALS) {
        await this.prisma.businessVertical.upsert({
          where: { code: v.code },
          update: {},
          create: {
            code: v.code,
            name: v.name,
            sortOrder: v.sortOrder,
            active: true,
          },
        });
      }
    }
  }

  async findAll() {
    await this.ensureDefaultVerticals();
    return this.prisma.businessVertical.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByCode(code: string) {
    await this.ensureDefaultVerticals();
    return this.prisma.businessVertical.findFirst({
      where: {
        OR: [
          { code: code.toUpperCase() },
          { id: code },
        ],
      },
    });
  }
}
