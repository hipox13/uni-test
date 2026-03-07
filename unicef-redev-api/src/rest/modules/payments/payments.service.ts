import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MidtransService } from '../../../shared/midtrans/midtrans.service';
import { ConfigService } from '@nestjs/config';
import { ChargeDto } from './dto/charge.dto';

/**
 * Status codes aligned with old UNICEF project:
 * 0 = INIT       (created, not yet charged or waiting)
 * 1 = ERROR      (system error during processing)
 * 2 = PENDING    (charged, waiting for payment)
 * 3 = FAILED     (payment failed/denied)
 * 4 = SUCCESS    (paid successfully)
 * 5 = EXPIRED    (payment window expired)
 * 6 = ACTIVE     (monthly recurring — active subscription)
 * 7 = WAITING    (waiting for GoPay linking, etc.)
 * 8 = STOPPED    (subscription stopped/cancelled)
 */
export const TX_STATUS = {
  INIT: 0,
  ERROR: 1,
  PENDING: 2,
  FAILED: 3,
  SUCCESS: 4,
  EXPIRED: 5,
  ACTIVE: 6,
  WAITING: 7,
  STOPPED: 8,
} as const;

export const TX_STATUS_LABEL: Record<number, string> = {
  0: 'Init',
  1: 'Error',
  2: 'Pending',
  3: 'Failed',
  4: 'Success',
  5: 'Expired',
  6: 'Active',
  7: 'Waiting',
  8: 'Stopped',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly serverKey: string;
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
    private readonly config: ConfigService,
  ) {
    this.serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY', '');
    this.webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  /**
   * ONE-OFF charge flow (donateType = 2):
   * 1. Create transaction (status=INIT)
   * 2. Charge via Midtrans
   * 3. Store gateway response
   * 4. Update to PENDING
   * 5. Return payment instructions (VA, deeplink, etc.)
   */
  async chargeOneOff(dto: ChargeDto, userId?: number | null) {
    const refId = this.generateRefId();

    const tx = await this.prisma.uniTransaction.create({
      data: {
        refId,
        donateType: 2,
        campaignType: dto.campaignType ?? 1,
        amount: BigInt(dto.amount),
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        email: dto.email,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        paymentGateway: 'midtrans',
        articleId: dto.articleId ?? null,
        userId: userId ?? null,
        status: TX_STATUS.INIT,
        dateCreated: new Date(),
        lastUpdated: new Date(),
        utm_source: dto.utm_source ?? null,
        utm_medium: dto.utm_medium ?? null,
        utm_content: dto.utm_content ?? null,
        utm_campaign: dto.utm_campaign ?? null,
        utm_term: dto.utm_term ?? null,
      },
    });

    const midtransRes = await this.midtrans.createCharge({
      order_id: refId,
      gross_amount: dto.amount,
      payment_type: dto.paymentMethod,
      bank: dto.bankCode,
      customer_details: {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
      custom_expiry: { expiry_duration: 24, unit: 'hour' },
      item_details: [{
        id: `DONATION-${dto.articleId ?? 'general'}`,
        price: dto.amount,
        quantity: 1,
        name: 'UNICEF Donation',
      }],
    });

    await this.storeResponse(refId, midtransRes);

    if (midtransRes.status_code === '201' || midtransRes.status_code === '200') {
      await this.prisma.uniTransaction.update({
        where: { refId },
        data: { status: TX_STATUS.PENDING, lastUpdated: new Date() },
      });
    } else {
      await this.prisma.uniTransaction.update({
        where: { refId },
        data: { status: TX_STATUS.ERROR, lastUpdated: new Date() },
      });
    }

    return { transaction: this.serializeTx(tx), midtrans: midtransRes };
  }

  /**
   * MONTHLY charge flow (donateType = 1):
   * 1. Create transaction (status=INIT)
   * 2. First charge via Midtrans bank_transfer
   * 3. Store response
   * 4. Update to PENDING
   * 5. When first payment confirmed via webhook → status=ACTIVE
   * 6. Cron retries subsequent months
   */
  async chargeMonthly(dto: ChargeDto, userId?: number | null) {
    const refId = this.generateRefId();

    const tx = await this.prisma.uniTransaction.create({
      data: {
        refId,
        donateType: 1,
        campaignType: dto.campaignType ?? 1,
        amount: BigInt(dto.amount),
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        email: dto.email,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        paymentGateway: 'midtrans',
        articleId: dto.articleId ?? null,
        userId: userId ?? null,
        status: TX_STATUS.INIT,
        dateCreated: new Date(),
        lastUpdated: new Date(),
        metaData: JSON.stringify({ recurring: true, interval: 'month', paymentMethod: dto.paymentMethod, bankCode: dto.bankCode ?? null }),
        utm_source: dto.utm_source ?? null,
        utm_medium: dto.utm_medium ?? null,
        utm_content: dto.utm_content ?? null,
        utm_campaign: dto.utm_campaign ?? null,
        utm_term: dto.utm_term ?? null,
      },
    });

    const midtransRes = await this.midtrans.createCharge({
      order_id: refId,
      gross_amount: dto.amount,
      payment_type: dto.paymentMethod,
      bank: dto.bankCode,
      customer_details: {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
      custom_expiry: { expiry_duration: 24, unit: 'hour' },
      item_details: [{
        id: `MONTHLY-${dto.articleId ?? 'general'}`,
        price: dto.amount,
        quantity: 1,
        name: 'UNICEF Monthly Donation',
      }],
      ...(dto.paymentMethod === 'gopay' ? {
        gopay: {
          enable_callback: true,
          callback_url: `${this.webUrl}/en/donate/success`,
          recurring: false,
        },
      } : {}),
    });

    await this.storeResponse(refId, midtransRes);

    if (midtransRes.status_code === '201' || midtransRes.status_code === '200') {
      await this.prisma.uniTransaction.update({
        where: { refId },
        data: { status: TX_STATUS.PENDING, lastUpdated: new Date() },
      });

      await this.prisma.uniTransactionPaid.create({
        data: {
          refId,
          paymentGateway: 'midtrans',
          amount: BigInt(dto.amount),
          paidAmount: BigInt(0),
          status: TX_STATUS.PENDING,
          dateCreated: new Date(),
          cycleNumber: 1,
        },
      });
    } else {
      await this.prisma.uniTransaction.update({
        where: { refId },
        data: { status: TX_STATUS.ERROR, lastUpdated: new Date() },
      });
    }

    return { transaction: this.serializeTx(tx), midtrans: midtransRes };
  }

  /**
   * Midtrans notification webhook handler.
   * Verifies SHA-512 signature, maps status, updates transaction.
   */
  async handleMidtransNotification(body: Record<string, any>) {
    const {
      order_id, status_code, gross_amount, signature_key,
      transaction_status, fraud_status, transaction_id, payment_type,
    } = body;

    const expectedSig = createHash('sha512')
      .update(order_id + status_code + gross_amount + this.serverKey)
      .digest('hex');

    if (signature_key !== expectedSig) {
      this.logger.warn(`Invalid signature for order ${order_id}`);
      return { received: false, message: 'Invalid signature' };
    }

    const baseRefId = order_id.replace(/-retry-\d+$/, '');
    const tx = await this.prisma.uniTransaction.findUnique({
      where: { refId: baseRefId },
      include: { paids: true },
    });
    if (!tx) {
      this.logger.warn(`Transaction not found: ${order_id}`);
      return { received: false, message: 'Transaction not found' };
    }

    const newStatus = this.mapMidtransStatus(transaction_status, fraud_status);
    const isMonthly = tx.donateType === 1;

    await this.storeResponse(baseRefId, body, transaction_id);

    if (newStatus === TX_STATUS.SUCCESS) {
      const txStatus = isMonthly ? TX_STATUS.ACTIVE : TX_STATUS.SUCCESS;
      await this.prisma.uniTransaction.update({
        where: { refId: baseRefId },
        data: {
          status: txStatus,
          lastUpdated: new Date(),
          ...(isMonthly ? { nextScheduleAt: this.getNextMonthDate() } : {}),
        },
      });

      const cycleMatch = order_id.match(/-retry-(\d+)$/);
      const cycleNumber = cycleMatch ? parseInt(cycleMatch[1], 10) : 1;

      const existingPaid = await this.prisma.uniTransactionPaid.findFirst({
        where: { refId: baseRefId, cycleNumber, status: { not: TX_STATUS.SUCCESS } },
      });

      const paidData = {
        paymentGateway: payment_type ?? 'midtrans',
        amount: tx.amount,
        paidAmount: BigInt(Math.round(parseFloat(gross_amount))),
        paidValid: 1,
        status: TX_STATUS.SUCCESS,
        paidAt: new Date(),
        invoiceId: transaction_id,
        cycleNumber,
      };

      if (existingPaid) {
        await this.prisma.uniTransactionPaid.update({
          where: { id: existingPaid.id },
          data: paidData,
        });
      } else {
        await this.prisma.uniTransactionPaid.create({
          data: { refId: baseRefId, dateCreated: new Date(), ...paidData },
        });
      }
    } else if (newStatus === TX_STATUS.EXPIRED) {
      const isAlreadyActive = tx.status === TX_STATUS.ACTIVE;
      if (!isAlreadyActive) {
        await this.prisma.uniTransaction.update({
          where: { refId: baseRefId },
          data: { status: TX_STATUS.EXPIRED, lastUpdated: new Date() },
        });
      }
    } else if (newStatus === TX_STATUS.FAILED) {
      const isAlreadyActive = tx.status === TX_STATUS.ACTIVE;
      if (!isAlreadyActive) {
        await this.prisma.uniTransaction.update({
          where: { refId: baseRefId },
          data: { status: TX_STATUS.FAILED, lastUpdated: new Date() },
        });
      }
    } else {
      const finalStatus = (isMonthly && newStatus === TX_STATUS.SUCCESS) ? TX_STATUS.ACTIVE : newStatus;
      await this.prisma.uniTransaction.update({
        where: { refId: baseRefId },
        data: {
          status: finalStatus,
          lastUpdated: new Date(),
          ...(isMonthly && finalStatus === TX_STATUS.ACTIVE ? { nextScheduleAt: this.getNextMonthDate() } : {}),
        },
      });
    }

    this.logger.log(`Notification processed: ${order_id} → ${TX_STATUS_LABEL[newStatus]}`);
    return { received: true };
  }

  async getTransactionStatus(refId: string) {
    const tx = await this.prisma.uniTransaction.findUnique({
      where: { refId },
      include: { paids: { orderBy: { cycleNumber: 'asc' } } },
    });
    if (!tx) throw new NotFoundException(`Transaction ${refId} not found`);

    const isMonthly = tx.donateType === 1;
    let anySuccess = false;

    // 1. Sync all cycles
    for (const paid of tx.paids) {
      if (paid.status === TX_STATUS.SUCCESS) {
        anySuccess = true;
        continue;
      }

      try {
        const orderId = paid.cycleNumber === 1 ? refId : `${refId}-retry-${paid.cycleNumber}`;
        const midtransRes = await this.midtrans.getStatus(orderId);
        const newStatus = this.mapMidtransStatus(midtransRes.transaction_status, midtransRes.fraud_status);

        if (newStatus === TX_STATUS.SUCCESS) {
          anySuccess = true;
          const grossAmount = midtransRes.gross_amount ? Math.round(parseFloat(midtransRes.gross_amount)) : 0;
          await this.prisma.uniTransactionPaid.update({
            where: { id: paid.id },
            data: {
              paidAmount: BigInt(grossAmount),
              status: TX_STATUS.SUCCESS,
              paidAt: new Date(),
              invoiceId: midtransRes.transaction_id,
              failedMessage: midtransRes.va_numbers?.[0]?.va_number || null,
            },
          });
        } else if (paid.status !== newStatus || midtransRes.va_numbers?.[0]?.va_number || midtransRes.actions) {
          // Extract instructions (VA or QR URL)
          let instruction = midtransRes.va_numbers?.[0]?.va_number || paid.failedMessage;
          if (midtransRes.actions) {
            const qrAction = midtransRes.actions.find((a: any) => a.name === 'generate-qr-code');
            if (qrAction) instruction = qrAction.url;
          }

          await this.prisma.uniTransactionPaid.update({
            where: { id: paid.id },
            data: {
              status: newStatus,
              failedMessage: instruction,
            },
          });
        }
      } catch (err) {
        // Skip individual failure
      }
    }

    // 2. Update main transaction status based on success in ANY cycle
    let finalStatus = tx.status;
    if (anySuccess) {
      finalStatus = isMonthly ? TX_STATUS.ACTIVE : TX_STATUS.SUCCESS;
    }

    const needsScheduleFix = isMonthly && finalStatus === TX_STATUS.ACTIVE && !tx.nextScheduleAt;

    if (tx.status !== finalStatus || needsScheduleFix) {
      await this.prisma.uniTransaction.update({
        where: { refId },
        data: {
          status: finalStatus,
          lastUpdated: new Date(),
          ...(needsScheduleFix ? { nextScheduleAt: this.getNextMonthDate() } : {}),
        },
      });
    }

    // Return fresh data
    const updatedTx = await this.prisma.uniTransaction.findUnique({
      where: { refId },
      include: { paids: { orderBy: { cycleNumber: 'asc' } } },
    });

    return {
      transaction: this.serializeTx(updatedTx),
      midtrans: null, // No longer single source
    };
  }

  async cancelPayment(refId: string) {
    const tx = await this.prisma.uniTransaction.findUnique({ where: { refId } });
    if (!tx) throw new NotFoundException(`Transaction ${refId} not found`);

    if (tx.status === TX_STATUS.SUCCESS || tx.status === TX_STATUS.ACTIVE) {
      throw new BadRequestException('Cannot cancel a completed/active transaction');
    }

    let midtransRes: any = null;
    try {
      midtransRes = await this.midtrans.cancelTransaction(refId);
    } catch {
      this.logger.warn(`Midtrans cancel failed for ${refId}`);
    }

    await this.prisma.uniTransaction.update({
      where: { refId },
      data: { status: TX_STATUS.STOPPED, lastUpdated: new Date() },
    });

    return { transaction: this.serializeTx({ ...tx, status: TX_STATUS.STOPPED }), midtrans: midtransRes };
  }

  /** Stop a monthly subscription */
  async stopSubscription(refId: string) {
    const tx = await this.prisma.uniTransaction.findUnique({ where: { refId } });
    if (!tx) throw new NotFoundException(`Transaction ${refId} not found`);

    if (tx.donateType !== 1) {
      throw new BadRequestException('Only monthly transactions can be stopped');
    }

    const meta = tx.metaData ? JSON.parse(tx.metaData as string) : {};
    if (meta.subscriptionId) {
      try {
        await this.midtrans.disableSubscription(meta.subscriptionId);
      } catch {
        this.logger.warn(`Failed to disable Midtrans subscription for ${refId}`);
      }
    }

    await this.prisma.uniTransaction.update({
      where: { refId },
      data: { status: TX_STATUS.STOPPED, lastUpdated: new Date() },
    });

    return { message: `Subscription ${refId} stopped` };
  }

  /** Bulk stop monthly subscriptions */
  async bulkStop(refIds: string[]) {
    const results: Array<{ refId: string; success: boolean; message?: string }> = [];
    for (const refId of refIds) {
      try {
        await this.stopSubscription(refId);
        results.push({ refId, success: true });
      } catch (err) {
        results.push({
          refId,
          success: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return { results, total: refIds.length };
  }

  /** Creates a retry charge for monthly. Used by PaymentRetryService. */
  async createRetryCharge(
    tx: {
      refId: string;
      amount: bigint | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      metaData: string | null;
    },
    cycleNumber: number,
  ) {
    const orderId = `${tx.refId}-retry-${cycleNumber}`;

    // Parse metaData to recover the original payment method
    let meta: any = {};
    try { if (tx.metaData) meta = JSON.parse(tx.metaData); } catch { /* ignore */ }

    const originalMethod: string = meta.paymentMethod ?? 'bank_transfer';
    const originalBank: string = meta.bankCode ?? 'bca';

    this.logger.log(`Retry ${orderId}: using original method=${originalMethod}, bank=${originalBank}`);

    const res = await this.midtrans.createCharge({
      order_id: orderId,
      gross_amount: Number(tx.amount ?? 0),
      payment_type: originalMethod as any,
      ...(originalMethod === 'bank_transfer' ? { bank: originalBank } : {}),
      ...(originalMethod === 'gopay' ? { gopay: { enable_callback: true, recurring: false } } : {}),
      ...(originalMethod === 'shopeepay' ? { shopeepay: { callback_url: '' } } : {}),
      customer_details: {
        first_name: tx.firstName ?? undefined,
        last_name: tx.lastName ?? undefined,
        email: tx.email ?? undefined,
        phone: tx.phone ?? undefined,
      },
      custom_expiry: { expiry_duration: 24, unit: 'hour' },
    });

    await this.storeResponse(tx.refId, res, undefined, `retry-${cycleNumber}`);
    return res;
  }

  /**
   * Specifically cancel a retry cycle (va hangus)
   * This does NOT stop the main subscription, it just expires one specific payment attempt.
   */
  async cancelRetryPayment(refId: string, cycle: number) {
    const orderId = cycle === 1 ? refId : `${refId}-retry-${cycle}`;
    this.logger.log(`Cancelling previous cycle: ${orderId}`);

    try {
      await this.midtrans.cancelTransaction(orderId);
    } catch {
      // Might already be expired/cancelled at Midtrans
    }

    await this.prisma.uniTransactionPaid.updateMany({
      where: { refId, cycleNumber: cycle, status: TX_STATUS.PENDING },
      data: { status: TX_STATUS.EXPIRED },
    });
  }

  private mapMidtransStatus(txStatus: string, fraudStatus?: string): number {
    if (!txStatus) return TX_STATUS.INIT;
    const s = txStatus.toLowerCase();
    if ((s === 'capture' && fraudStatus === 'accept') || s === 'settlement') return TX_STATUS.SUCCESS;
    if (s === 'pending') return TX_STATUS.PENDING;
    if (s === 'deny' || s === 'cancel') return TX_STATUS.FAILED;
    if (s === 'expire') return TX_STATUS.EXPIRED;
    return TX_STATUS.PENDING;
  }

  private generateRefId(): string {
    const now = new Date();
    const ts = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const rand = randomBytes(4).toString('hex');
    return `UNICEF-${ts}-${rand}`;
  }

  private async storeResponse(refId: string, responseData: any, responseRefId?: string, slug?: string) {
    try {
      await this.prisma.uniTransactionResponse.create({
        data: {
          refId,
          responseRefId: responseRefId ?? responseData?.transaction_id ?? null,
          status: responseData?.transaction_status ?? responseData?.status_code ?? null,
          dateCreated: new Date(),
          responseType: 0,
          callbackSlug: slug ?? null,
          paymentGateway: 'midtrans',
          responseText: JSON.stringify(responseData),
          payload: JSON.stringify(responseData),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to store response for ${refId}: ${err}`);
    }
  }

  private serializeTx(tx: any) {
    if (!tx) return null;

    // Derive payment method label from metaData (where we now store it)
    let paymentMethod = tx.paymentGateway || 'Unknown';
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
      statusLabel: TX_STATUS_LABEL[tx.status] ?? 'Unknown',
      paymentMethod,
      paids: (tx.paids || []).map((p: any) => ({
        ...p,
        id: p.id != null ? Number(p.id) : p.id,
        amount: p.amount != null ? Number(p.amount) : p.amount,
        paidAmount: p.paidAmount != null ? Number(p.paidAmount) : p.paidAmount,
      })),
    };
  }

  private getNextMonthDate(): Date {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d;
  }
  async getRefundRequests() {
    return this.prisma.redevRefundRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        transaction: {
          select: {
            refId: true,
            amount: true,
            status: true,
            paymentGateway: true,
            article: { select: { title: true } }
          }
        },
        user: { select: { name: true, email: true } },
      }
    });
  }

  async approveRefund(id: bigint, adminId: number, responseMessage: string, manual: boolean = false) {
    const request = await this.prisma.redevRefundRequest.findUnique({
      where: { id },
      include: { transaction: { include: { paids: { orderBy: { paidAt: 'desc' } } } } },
    });
    if (!request) throw new NotFoundException('Refund request not found');
    if (request.status !== 'pending') throw new BadRequestException('Refund is not pending');

    const tx = request.transaction;

    // If it's a monthly donation, stop it now so we don't charge them again next cycle
    if (tx.donateType === 1 && tx.status !== TX_STATUS.STOPPED) {
      await this.prisma.uniTransaction.update({
        where: { refId: tx.refId },
        data: { status: TX_STATUS.STOPPED, lastUpdated: new Date() },
      });
      this.logger.log(`Subscription stopped for ${tx.refId} due to refund approval`);
    }

    // Manual fallback: skip Midtrans API call
    if (manual) {
      const result = await this.prisma.redevRefundRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          responseMessage: responseMessage || 'Approved Manually',
        },
      });
      return {
        ...result,
        id: result.id != null ? Number(result.id) : result.id,
        manual: true,
      };
    }

    // Find the latest successful payment
    const paid = tx.paids.find(p => p.status === TX_STATUS.SUCCESS) || tx.paids[0];
    if (!paid) throw new BadRequestException('No successful payment found to refund');

    const orderId = paid.cycleNumber && paid.cycleNumber > 1 ? `${tx.refId}-retry-${paid.cycleNumber}` : tx.refId;

    try {
      const midtransRes = await this.midtrans.refundTransaction(orderId, Number(tx.amount), request.reason || 'Refunded by admin');
      if (midtransRes.status_code === '200') {
        const result = await this.prisma.redevRefundRequest.update({
          where: { id },
          data: {
            status: 'approved',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            responseMessage,
          },
        });
        return {
          ...result,
          id: result.id != null ? Number(result.id) : result.id,
        };
      } else {
        throw new BadRequestException(midtransRes.status_message || 'Refund failed at Midtrans');
      }
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Error processing refund');
    }
  }

  async rejectRefund(id: bigint, adminId: number, responseMessage: string) {
    const request = await this.prisma.redevRefundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Refund request not found');
    if (request.status !== 'pending') throw new BadRequestException('Refund is not pending');

    const result = await this.prisma.redevRefundRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        responseMessage,
      },
    });
    return {
      ...result,
      id: result.id != null ? Number(result.id) : result.id,
    };
  }
}
