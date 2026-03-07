import { Controller, Post, Get, Param, Body, HttpCode, Req } from '@nestjs/common';
import { PaymentsService, TX_STATUS, TX_STATUS_LABEL } from './payments.service';
import { ChargeDto } from './dto/charge.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Public()
  @Post('charge')
  async charge(@Body() dto: ChargeDto, @Req() req: Request) {
    const userId = (req as any).user?.sub ?? null;
    if (dto.donateType === 1) {
      return this.paymentsService.chargeMonthly(dto, userId);
    }
    return this.paymentsService.chargeOneOff(dto, userId);
  }

  @Public()
  @Post('notification')
  @HttpCode(200)
  async notification(@Body() body: Record<string, any>) {
    return this.paymentsService.handleMidtransNotification(body);
  }

  @Public()
  @Get('status/:refId')
  async status(@Param('refId') refId: string) {
    return this.paymentsService.getTransactionStatus(refId);
  }

  @Public()
  @Post('cancel/:refId')
  async cancel(@Param('refId') refId: string) {
    return this.paymentsService.cancelPayment(refId);
  }

  @Public()
  @Post('stop/:refId')
  async stopSubscription(@Param('refId') refId: string) {
    return this.paymentsService.stopSubscription(refId);
  }
  @Public()
  @Post('bulk-stop')
  async bulkStop(@Body('refIds') refIds: string[]) {
    return this.paymentsService.bulkStop(refIds);
  }

  @Public()
  @Get('status-codes')
  getStatusCodes() {
    return { statuses: TX_STATUS, labels: TX_STATUS_LABEL };
  }

  @Get('refunds')
  async getRefundRequests() {
    const items = await this.paymentsService.getRefundRequests();
    return items.map(r => ({
      ...r,
      id: r.id != null ? Number(r.id) : r.id,
      transaction: r.transaction ? {
        ...r.transaction,
        amount: r.transaction.amount != null ? Number(r.transaction.amount) : r.transaction.amount
      } : null,
    }));
  }

  @Post('refunds/:id/approve')
  approveRefund(
    @Param('id') id: string,
    @Body('responseMessage') responseMessage: string,
    @Body('manual') manual: boolean,
    @CurrentUser() user: { id: number },
  ) {
    return this.paymentsService.approveRefund(BigInt(id), user.id, responseMessage, manual);
  }

  @Post('refunds/:id/reject')
  rejectRefund(
    @Param('id') id: string,
    @Body('responseMessage') responseMessage: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.paymentsService.rejectRefund(BigInt(id), user.id, responseMessage);
  }
}
