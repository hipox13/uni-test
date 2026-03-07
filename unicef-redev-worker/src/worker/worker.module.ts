import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { PaymentCronService } from './cron/payment-cron.service';
import { SalesforceCronService } from './cron/salesforce-cron.service';
import { EmailCronService } from './cron/email-cron.service';

/**
 * Worker application: cron + Bull processors only. No HTTP.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    PrismaModule,
    // Register queues as needed, e.g. BullModule.registerQueue({ name: 'payment' }),
  ],
  providers: [PaymentCronService, SalesforceCronService, EmailCronService],
})
export class WorkerModule {}
