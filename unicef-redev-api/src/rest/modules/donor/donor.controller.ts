import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DonorService } from './donor.service';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { DonorQueryDto } from './dto/donor-query.dto';

@Controller('api/v1/donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) { }

  @Get('profile')
  getProfile(@CurrentUser() user: { id: number }) {
    return this.donorService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateDonorDto,
  ) {
    return this.donorService.updateProfile(user.id, dto);
  }

  @Get('donations')
  getDonations(
    @CurrentUser() user: { id: number },
    @Query() query: DonorQueryDto,
  ) {
    return this.donorService.getDonations(user.id, query);
  }

  @Get('donations/:refId')
  getDonation(
    @CurrentUser() user: { id: number },
    @Param('refId') refId: string,
  ) {
    return this.donorService.getDonationByRefId(user.id, refId);
  }

  @Post('refunds/:refId')
  requestRefund(
    @CurrentUser() user: { id: number },
    @Param('refId') refId: string,
    @Body('reason') reason?: string,
  ) {
    return this.donorService.requestRefund(user.id, refId, reason || '');
  }

  @Get('subscriptions')
  getSubscriptions(@CurrentUser() user: { id: number }) {
    return this.donorService.getSubscriptions(user.id);
  }

  @Post('subscriptions/:refId/cancel')
  cancelSubscription(
    @CurrentUser() user: { id: number },
    @Param('refId') refId: string,
  ) {
    return this.donorService.cancelSubscription(user.id, refId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { id: number }) {
    return this.donorService.getStats(user.id);
  }

  @Get('refunds')
  getRefundRequests(@CurrentUser() user: { id: number }) {
    return this.donorService.getRefundRequests(user.id);
  }
}
