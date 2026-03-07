import { Controller, Get, Query, Header } from '@nestjs/common';
import { ContentService } from './content.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  getSitemap(@Query('baseUrl') baseUrl?: string) {
    return this.contentService.generateSitemap(baseUrl);
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  getRobots() {
    return this.contentService.generateRobots();
  }

  @Public()
  @Get('preview')
  getPreview(@Query('token') token: string) {
    return this.contentService.getPreviewByToken(token);
  }
}
