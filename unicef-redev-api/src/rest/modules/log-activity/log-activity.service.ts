import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LogActivityQueryDto } from './dto/log-activity-query.dto';

@Injectable()
export class LogActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LogActivityQueryDto) {
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.uniLogActivity.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { dateCreated: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.uniLogActivity.count({ where }),
    ]);

    return { data, total, limit: query.limit, offset: query.offset };
  }

  async count() {
    const total = await this.prisma.uniLogActivity.count();
    return { total };
  }

  async create(data: {
    dataId?: string;
    userId?: number;
    dataBefore?: string;
    dataAfter?: string;
    feature?: string;
    action?: string;
    ipAddress?: string;
  }) {
    return this.prisma.uniLogActivity.create({
      data: { ...data, dateCreated: new Date() },
    });
  }

  private buildWhere(query: LogActivityQueryDto): Prisma.UniLogActivityWhereInput {
    const where: Prisma.UniLogActivityWhereInput = {};

    if (query.feature) where.feature = query.feature;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    if (query.dateFrom || query.dateTo) {
      where.dateCreated = {};
      if (query.dateFrom) where.dateCreated.gte = new Date(query.dateFrom);
      if (query.dateTo) where.dateCreated.lte = new Date(query.dateTo);
    }

    return where;
  }
}
