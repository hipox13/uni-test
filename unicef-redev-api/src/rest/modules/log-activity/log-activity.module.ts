import { Module } from '@nestjs/common';
import { LogActivityService } from './log-activity.service';
import { LogActivityController } from './log-activity.controller';

@Module({
  providers: [LogActivityService],
  controllers: [LogActivityController],
  exports: [LogActivityService],
})
export class LogActivityModule {}
