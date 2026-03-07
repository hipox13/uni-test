import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Cron: email reminders (e.g. payment reminders).
 */
@Injectable()
export class EmailCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 9 * * *') // daily 9:00
  async sendReminders() {
    console.log('[EmailCron] Running email reminders');
    // TODO: send payment reminders, etc.
  }
}
