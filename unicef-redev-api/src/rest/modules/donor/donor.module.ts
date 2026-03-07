import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [DonorController],
  providers: [DonorService],
})
export class DonorModule { }
