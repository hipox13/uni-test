import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsModule } from '../../rest/modules/payments/payments.module';
import { WebSocketModule } from '../../websocket/websocket.module';
import { PaymentRetryService } from './payment-retry.service';

@Module({
  imports: [ScheduleModule.forRoot(), PaymentsModule, WebSocketModule],
  providers: [PaymentRetryService],
})
export class SchedulerModule { }
