import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TransactionQueryDto) {
    const where = this.buildWhere(query);
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [data, total] = await Promise.all([
      this.prisma.uniTransaction.findMany({
        where,
        include: { user: true, article: true, paids: true },
        orderBy: { dateCreated: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.uniTransaction.count({ where }),
    ]);

    return {
      data: data.map((tx) => this.serialize(tx)),
      total,
      limit,
      offset,
    };
  }

  async findOne(refId: string) {
    const tx = await this.prisma.uniTransaction.findUnique({
      where: { refId },
      include: { user: true, article: true, paids: true, paymentChannel: true },
    });
    if (!tx) throw new NotFoundException(`Transaction ${refId} not found`);
    return this.serialize(tx);
  }

  async findByUser(userId: number) {
    const data = await this.prisma.uniTransaction.findMany({
      where: { userId },
      include: { article: true, paids: true },
      orderBy: { dateCreated: 'desc' },
    });
    return data.map((tx) => this.serialize(tx));
  }

  async getDashboardStats() {
    const [total, totalAmount, byStatus, byCampaign, uniqueEmails] = await Promise.all([
      this.prisma.uniTransaction.count(),
      this.prisma.uniTransaction.aggregate({ _sum: { amount: true } }),
      this.prisma.uniTransaction.groupBy({ by: ['status'], _count: true }),
      this.prisma.uniTransaction.groupBy({ by: ['campaignType'], _count: true }),
      this.prisma.uniTransaction.groupBy({ by: ['email'], _count: true }),
    ]);

    return {
      totalTransactions: total,
      totalAmount: totalAmount._sum.amount != null ? Number(totalAmount._sum.amount) : 0,
      totalDonors: uniqueEmails.filter((e) => e.email).length,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byCampaignType: byCampaign.map((c) => ({ campaignType: c.campaignType, count: c._count })),
    };
  }

  async count() {
    return { count: await this.prisma.uniTransaction.count() };
  }

  private buildWhere(query: TransactionQueryDto) {
    const where: any = {};

    if (query.status != null) where.status = query.status;
    if (query.campaignType != null) where.campaignType = query.campaignType;
    if ((query as any).donateType != null) where.donateType = Number((query as any).donateType);

    if (query.dateFrom || query.dateTo) {
      where.dateCreated = {};
      if (query.dateFrom) where.dateCreated.gte = new Date(query.dateFrom);
      if (query.dateTo) where.dateCreated.lte = new Date(query.dateTo);
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { refId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private serialize(tx: any) {
    return {
      ...tx,
      id: tx.id != null ? Number(tx.id) : tx.id,
      amount: tx.amount != null ? Number(tx.amount) : tx.amount,
      paids: tx.paids?.map((p: any) => ({
        ...p,
        id: p.id != null ? Number(p.id) : p.id,
        amount: p.amount != null ? Number(p.amount) : p.amount,
        paidAmount: p.paidAmount != null ? Number(p.paidAmount) : p.paidAmount,
      })),
    };
  }
}
