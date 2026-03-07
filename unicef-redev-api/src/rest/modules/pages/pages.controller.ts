import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { GeneratePreviewTokenDto } from './dto/preview-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

const DEV_USER_ID = 1;

@Controller('api/v1/pages')
@UseGuards(JwtAuthGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) { }

  @Public() @Get('preview/by-token')
  getPreviewByToken(@Query('token') token: string) {
    return this.pagesService.getPreviewByToken(token);
  }

  @Public() @Get()
  findAll(@Query() query: PageQueryDto) { return this.pagesService.findAll(query); }

  @Public() @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) { return this.pagesService.findBySlug(slug); }

  @Public() @Get(':id')
  findOne(@Param('id') id: string) { return this.pagesService.findOne(BigInt(id)); }

  @Public() @Post()
  async create(@Body() dto: CreatePageDto) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.create(dto, userId);
  }

  @Public() @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.update(BigInt(id), dto, userId);
  }

  @Public() @Post(':id/duplicate')
  async duplicate(@Param('id') id: string) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.duplicate(BigInt(id), userId);
  }

  @Public() @Post(':id/publish')
  async publish(@Param('id') id: string) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.publish(BigInt(id), userId);
  }

  @Public() @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.unpublish(BigInt(id), userId);
  }

  @Public() @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.pagesService.remove(BigInt(id)); }

  @Public() @Post(':id/preview')
  async generatePreviewToken(@Param('id') id: string, @Body() dto: GeneratePreviewTokenDto) {
    const userId = await this.pagesService.getAnyUserId();
    return this.pagesService.generatePreviewToken(BigInt(id), userId, dto.expiresInMinutes || 60);
  }

  @Public() @Get(':id/versions')
  findVersions(@Param('id') id: string) { return this.pagesService.findVersions(BigInt(id)); }
}
