import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaQueryDto } from './dto/media-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { EmbedVideoDto } from './dto/embed-video.dto';
import { CropImageDto } from './dto/crop-image.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Public()
  @Get()
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(BigInt(id));
  }

  @Public()
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.mediaService.getFilePath(BigInt(id));
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    res.sendFile(filePath);
  }

  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const defaultUserId = 1;
    return this.mediaService.upload(file, defaultUserId);
  }

  @Public()
  @Post('embed')
  async embed(@Body() dto: EmbedVideoDto) {
    const defaultUserId = 1;
    return this.mediaService.embedVideo(dto, defaultUserId);
  }

  @Public()
  @Post(':id/crop')
  async crop(@Param('id') id: string, @Body() dto: CropImageDto) {
    return this.mediaService.cropImage(BigInt(id), dto);
  }

  @Public()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(BigInt(id), updateMediaDto);
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(BigInt(id));
  }
}
