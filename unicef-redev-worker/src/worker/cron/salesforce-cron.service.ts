import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Cron: Salesforce sync.
 */
@Injectable()
export class SalesforceCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 */6 * * *') // every 6 hours
  async syncSalesforce() {
    console.log('[SalesforceCron] Running Salesforce sync');
    // TODO: sync with Salesforce API
  }
}
