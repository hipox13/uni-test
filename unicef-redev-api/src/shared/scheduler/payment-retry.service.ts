import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService, TX_STATUS } from '../../rest/modules/payments/payments.service';
import { SystemGateway } from '../../websocket/system.gateway';

/**
 * Monthly payment retry — aligned with old project logic:
 */
@Injectable()
export class PaymentRetryService {
  private readonly logger = new Logger(PaymentRetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly systemGateway: SystemGateway,
  ) {
    this.logger.log('PaymentRetryService initialized');
  }

  @Cron('*/5 * * * *')
  async retryMonthlyPayments() {
    const now = new Date();
    this.logger.log(`Cron: retryMonthlyPayments check at ${now.toISOString()}`);

    const activeMonthlies = await this.prisma.uniTransaction.findMany({
      where: {
        donateType: 1,
        status: TX_STATUS.ACTIVE,
        nextScheduleAt: { lte: now },
      },
      include: { paids: { orderBy: { cycleNumber: 'desc' }, take: 1 } },
    });

    if (activeMonthlies.length > 0) {
      this.logger.log(`Found ${activeMonthlies.length} monthly transactions due for retry query (lte ${now.toISOString()})`);
    }

    if (activeMonthlies.length === 0) return;

    this.logger.log(`Found ${activeMonthlies.length} monthly transactions due for retry`);

    for (const tx of activeMonthlies) {
      try {
        const lastCycle = tx.paids[0]?.cycleNumber ?? 0;
        const newCycle = lastCycle + 1;

        // Expire previous cycle if it's still pending (VA Hangus)
        if (lastCycle > 0 && tx.paids[0].status === TX_STATUS.PENDING) {
          await this.paymentsService.cancelRetryPayment(tx.refId, lastCycle);
        }

        const midtransRes = await this.paymentsService.createRetryCharge(tx, newCycle);

        // Extract instructions (VA or QR URL)
        let instruction = midtransRes?.va_numbers?.[0]?.va_number || null;
        if (!instruction && midtransRes?.actions) {
          const qrAction = midtransRes.actions.find((a: any) => a.name === 'generate-qr-code');
          if (qrAction) instruction = qrAction.url;
        }

        await this.prisma.uniTransactionPaid.create({
          data: {
            refId: tx.refId,
            paymentGateway: 'midtrans',
            amount: tx.amount,
            paidAmount: BigInt(0),
            status: TX_STATUS.PENDING,
            dateCreated: new Date(),
            cycleNumber: newCycle,
            failedMessage: instruction,
          },
        });

        const nextMonth = new Date(now);
        nextMonth.setMinutes(now.getMinutes() + 5);
        await this.prisma.uniTransaction.update({
          where: { refId: tx.refId },
          data: { nextScheduleAt: nextMonth, lastUpdated: new Date() },
        });

        this.logger.log(`Retry charge created: ${tx.refId} cycle ${newCycle}`);
        this.systemGateway.broadcast('payment:retry_created', {
          refId: tx.refId,
          cycleNumber: newCycle,
          amount: Number(tx.amount),
        });
      } catch (err) {
        this.logger.warn(
          `Retry failed for ${tx.refId}: ${err instanceof Error ? err.message : String(err)}`,
        );
        this.systemGateway.broadcast('payment:retry_failed', {
          refId: tx.refId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /** Also check for PENDING one-off transactions that might need status sync */
  @Cron('*/10 * * * *')
  async syncPendingStatuses() {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const pending = await this.prisma.uniTransaction.findMany({
      where: {
        status: TX_STATUS.PENDING,
        dateCreated: { lte: thirtyMinAgo },
      },
      take: 20,
      orderBy: { dateCreated: 'asc' },
    });

    for (const tx of pending) {
      try {
        const result = await this.paymentsService.getTransactionStatus(tx.refId);
        this.systemGateway.broadcast('payment:sync_success', {
          refId: tx.refId,
          newStatus: result.transaction.statusLabel,
        });
      } catch {
        // Status check failed, skip
      }
    }
  }
}
