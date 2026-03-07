import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Public()
  @Get()
  findAll(@Query() query: TransactionQueryDto) {
    return this.transactionsService.findAll(query);
  }

  @Public()
  @Get('stats')
  getDashboardStats() {
    return this.transactionsService.getDashboardStats();
  }

  @Public()
  @Get('count')
  count() {
    return this.transactionsService.count();
  }

  @Public()
  @Get('user/:userId')
  findByUser(@Param('userId') userId: number) {
    return this.transactionsService.findByUser(userId);
  }

  @Public()
  @Get(':refId')
  findOne(@Param('refId') refId: string) {
    return this.transactionsService.findOne(refId);
  }
}
