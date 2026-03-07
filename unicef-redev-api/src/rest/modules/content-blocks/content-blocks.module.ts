import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { ContentBlocksController } from './content-blocks.controller';
import { ContentBlocksService } from './content-blocks.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContentBlocksController],
  providers: [ContentBlocksService],
  exports: [ContentBlocksService],
})
export class ContentBlocksModule {}
