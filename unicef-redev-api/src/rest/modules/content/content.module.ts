import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PagesModule } from '../pages/pages.module';

/** Pages, FAQs, menus – CMS content for public site. */
@Module({
  imports: [PagesModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
