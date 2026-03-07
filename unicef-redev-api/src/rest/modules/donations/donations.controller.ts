import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller(['api/v1/donations', 'api/v1/articles'])
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) { }

  @Public()
  @Get('preview/by-token')
  getPreviewByToken(@Query('token') token: string) {
    return this.donationsService.getPreviewByToken(token);
  }

  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.donationsService.findBySlug(slug);
  }

  @Public()
  @Get()
  findAll() {
    return this.donationsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.findOne(id);
  }

  @Public()
  @Post()
  async create(@Body() dto: CreateDonationDto) {
    const userId = await this.donationsService.getAnyUserId();
    return this.donationsService.create(dto, userId);
  }

  @Public()
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDonationDto) {
    const userId = await this.donationsService.getAnyUserId();
    return this.donationsService.update(id, dto, userId);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.remove(id);
  }

  @Public()
  @Get(':id/versions')
  findVersions(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.findVersions(id);
  }

  @Public()
  @Post(':id/preview')
  async generatePreviewToken(
    @Param('id', ParseIntPipe) id: number,
    @Body('expiresInMinutes') expiresInMinutes?: number,
  ) {
    const userId = await this.donationsService.getAnyUserId();
    return this.donationsService.generatePreviewToken(id, userId, expiresInMinutes);
  }
}
