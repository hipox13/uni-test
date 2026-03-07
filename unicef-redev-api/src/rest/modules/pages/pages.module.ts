import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

/**
 * Pages Module - CMS page management (Gutenberg-style blocks).
 */
@Module({
  imports: [PrismaModule],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
