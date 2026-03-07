import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { DonorQueryDto } from './dto/donor-query.dto';
import { PaymentsService, TX_STATUS } from '../payments/payments.service';

@Injectable()
export class DonorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) { }

  async getProfile(userId: number) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        region: true,
        dateRegistered: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const donorWhere = this.buildDonorWhere(userId, user.email);

    const [donationCount, totalDonated] = await Promise.all([
      this.prisma.uniTransaction.count({ where: donorWhere }),
      this.prisma.uniTransaction.aggregate({
        where: { ...donorWhere, OR: [{ status: TX_STATUS.SUCCESS }, { status: TX_STATUS.ACTIVE }] },
        _sum: { amount: true },
      }),
    ]);

    const totalActive = await this.prisma.uniTransaction.count({
      where: { ...donorWhere, status: TX_STATUS.ACTIVE },
    });

    return {
      ...user,
      donationCount,
      totalDonated: totalDonated._sum.amount != null ? Number(totalDonated._sum.amount) : 0,
      activeSubscriptions: totalActive,
    };
  }

  async updateProfile(userId: number, dto: UpdateDonorDto) {
    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.region !== undefined) data.region = dto.region;

    return this.prisma.uniUser.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, name: true, phoneNumber: true,
        address: true, city: true, postalCode: true, region: true,
      },
    });
  }

  async getDonations(userId: number, query: DonorQueryDto) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const where: any = this.buildDonorWhere(userId, user.email);
    if (query.status !== undefined) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.dateCreated = {};
      if (query.dateFrom) where.dateCreated.gte = new Date(query.dateFrom);
      if (query.dateTo) where.dateCreated.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.uniTransaction.findMany({
        where,
        orderBy: { dateCreated: 'desc' },
        take: query.limit,
        skip: query.offset,
        select: {
          id: true, refId: true, amount: true, status: true,
          donateType: true, campaignType: true, paymentGateway: true,
          dateCreated: true, firstName: true, lastName: true, email: true,
          article: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.uniTransaction.count({ where }),
    ]);

    return {
      items: items.map((tx) => ({
        ...tx,
        id: tx.id != null ? Number(tx.id) : tx.id,
        amount: tx.amount != null ? Number(tx.amount) : tx.amount,
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getDonationByRefId(userId: number, refId: string) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const tx = await this.prisma.uniTransaction.findUnique({
      where: { refId },
      include: {
        article: { select: { id: true, title: true, slug: true, picture: true } },
        paids: { orderBy: { paidAt: 'desc' }, take: 10 },
        refundRequests: { orderBy: { requestedAt: 'desc' }, take: 1 },
      },
    });

    if (!tx) throw new NotFoundException('Donation not found');

    // Auto-sync status with Midtrans if it's pending (helps with local simulation issues)
    if (tx.status === TX_STATUS.PENDING || tx.status === TX_STATUS.ACTIVE) {
      try {
        await this.paymentsService.getTransactionStatus(refId);
      } catch {
        // Skip sync if fails
      }
    }

    const isOwner = tx.userId === userId || (user.email && tx.email && tx.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new NotFoundException('Donation not found');

    // Derive payment method label from metaData
    let paymentMethod = tx.paymentGateway || null;
    try {
      const meta = tx.metaData ? JSON.parse(tx.metaData) : {};
      if (meta.paymentMethod === 'gopay') paymentMethod = 'Gopay/QRIS';
      else if (meta.paymentMethod === 'shopeepay') paymentMethod = 'ShopeePay';
      else if (meta.paymentMethod === 'bank_transfer') paymentMethod = `Bank Transfer (${(meta.bankCode || 'bca').toUpperCase()})`;
      else if (meta.paymentMethod === 'credit_card') paymentMethod = 'Credit Card';
    } catch { /* ignore */ }

    return {
      ...tx,
      id: tx.id != null ? Number(tx.id) : tx.id,
      amount: tx.amount != null ? Number(tx.amount) : tx.amount,
      campaignName: tx.article?.title || null,
      donorName: [tx.firstName, tx.lastName].filter(Boolean).join(' ') || 'Donor',
      donorEmail: tx.email,
      paymentMethod,
      refundRequest: tx.refundRequests && tx.refundRequests.length > 0 ? {
        ...tx.refundRequests[0],
        id: tx.refundRequests[0].id != null ? Number(tx.refundRequests[0].id) : tx.refundRequests[0].id,
      } : null,
      paids: tx.paids.map(p => ({
        ...p,
        id: p.id != null ? Number(p.id) : p.id,
        amount: p.amount != null ? Number(p.amount) : p.amount,
        paidAmount: p.paidAmount != null ? Number(p.paidAmount) : p.paidAmount,
      }))
    };
  }

  async getSubscriptions(userId: number) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const where = {
      ...this.buildDonorWhere(userId, user.email),
      donateType: 1,
      status: TX_STATUS.ACTIVE,
    };

    const subs = await this.prisma.uniTransaction.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      select: {
        id: true, refId: true, amount: true, status: true,
        dateCreated: true, nextScheduleAt: true,
        article: { select: { id: true, title: true, slug: true } },
      },
    });

    return subs.map((tx) => ({
      ...tx,
      id: tx.id != null ? Number(tx.id) : tx.id,
      amount: tx.amount != null ? Number(tx.amount) : tx.amount,
    }));
  }

  async cancelSubscription(userId: number, refId: string) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const tx = await this.prisma.uniTransaction.findUnique({ where: { refId } });
    if (!tx) throw new NotFoundException('Subscription not found');

    const isOwner = tx.userId === userId || (user.email && tx.email && tx.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new NotFoundException('Subscription not found');
    if (tx.donateType !== 1) throw new BadRequestException('Not a monthly subscription');

    await this.prisma.uniTransaction.update({
      where: { refId },
      data: { status: TX_STATUS.STOPPED, lastUpdated: new Date() },
    });

    return { message: 'Subscription cancelled' };
  }

  async getStats(userId: number) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const donorWhere = this.buildDonorWhere(userId, user.email);

    const [totalDonated, totalTransactions, activeSubscriptions] = await Promise.all([
      this.prisma.uniTransaction.aggregate({
        where: { ...donorWhere, OR: [{ status: TX_STATUS.SUCCESS }, { status: TX_STATUS.ACTIVE }] },
        _sum: { amount: true },
      }),
      this.prisma.uniTransaction.count({ where: donorWhere }),
      this.prisma.uniTransaction.count({
        where: { ...donorWhere, donateType: 1, status: TX_STATUS.ACTIVE },
      }),
    ]);

    return {
      totalDonated: totalDonated._sum.amount != null ? Number(totalDonated._sum.amount) : 0,
      totalTransactions,
      activeSubscriptions,
    };
  }

  async requestRefund(userId: number, refId: string, reason: string) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const tx = await this.prisma.uniTransaction.findUnique({ where: { refId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    const isOwner = tx.userId === userId || (user.email && tx.email && tx.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new NotFoundException('Transaction not found');

    const statusNum = Number(tx.status);
    if (statusNum !== Number(TX_STATUS.SUCCESS) && statusNum !== Number(TX_STATUS.ACTIVE)) {
      throw new BadRequestException('Transaction is not eligible for refund');
    }

    const existingRequest = await this.prisma.redevRefundRequest.findFirst({
      where: { transactionRefId: refId },
    });
    if (existingRequest) {
      throw new BadRequestException('A refund request already exists for this transaction');
    }

    const request = await this.prisma.redevRefundRequest.create({
      data: {
        transactionRefId: refId,
        userId,
        reason,
        status: 'pending',
      },
    });

    return {
      ...request,
      id: request.id != null ? Number(request.id) : request.id,
    };
  }

  async getRefundRequests(userId: number) {
    const requests = await this.prisma.redevRefundRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      include: {
        transaction: {
          select: {
            refId: true,
            amount: true,
            status: true,
            dateCreated: true,
            article: { select: { title: true } }
          }
        }
      }
    });

    return requests.map(r => ({
      ...r,
      id: r.id != null ? Number(r.id) : r.id,
      transaction: r.transaction ? {
        ...r.transaction,
        amount: r.transaction.amount != null ? Number(r.transaction.amount) : r.transaction.amount,
      } : null,
    }));
  }

  /**
   * Match donations by userId OR email (because public donate page
   * doesn't require login, so userId may be null on the transaction)
   */
  private buildDonorWhere(userId: number, email: string | null): any {
    const conditions: any[] = [{ userId }];
    if (email) {
      conditions.push({ email: { equals: email, mode: 'insensitive' } });
    }
    return { OR: conditions };
  }

}
