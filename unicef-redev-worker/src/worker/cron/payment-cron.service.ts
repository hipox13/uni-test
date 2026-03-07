import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Cron: recurring payment processing, billing cycles.
 */
@Injectable()
export class PaymentCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *') // every hour – adjust as needed
  async handleRecurringPayments() {
    console.log('[PaymentCron] Running recurring payments check');
    // TODO: fetch due transactions, enqueue or process
  }
}
