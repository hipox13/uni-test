import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { BulkMenuDto } from './dto/bulk-menu.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/menus')
@UseGuards(JwtAuthGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) { }

  @Public()
  @Get()
  findAll(@Query() query: MenuQueryDto) {
    return this.menusService.findAll(query);
  }

  @Public()
  @Get('flat')
  findAllFlat(@Query() query: MenuQueryDto) {
    return this.menusService.findAllFlat(query);
  }

  @Public()
  @Get('public')
  findPublic(@Query('group') groupName?: string) {
    return this.menusService.findPublic(groupName);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(+id);
  }

  @Public()
  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    const defaultUserId = 1;
    return this.menusService.create(createMenuDto, defaultUserId);
  }

  @Public()
  @Post('bulk/publish')
  bulkPublish(@Body() dto: BulkMenuDto) {
    return this.menusService.bulkPublish(dto.ids);
  }

  @Public()
  @Post('bulk/unpublish')
  bulkUnpublish(@Body() dto: BulkMenuDto) {
    return this.menusService.bulkUnpublish(dto.ids);
  }

  @Public()
  @Post('bulk/delete')
  bulkDelete(@Body() dto: BulkMenuDto) {
    return this.menusService.bulkDelete(dto.ids);
  }

  @Public()
  @Patch('reorder')
  async reorder(@Body() reorderMenuDto: ReorderMenuDto) {
    return this.menusService.reorder(reorderMenuDto);
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    const defaultUserId = 1;
    return this.menusService.update(+id, updateMenuDto, defaultUserId);
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.menusService.remove(+id);
  }
}
