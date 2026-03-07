import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { LogActivityService } from './log-activity.service';
import { LogActivityQueryDto } from './dto/log-activity-query.dto';

@Controller('api/v1/log-activity')
export class LogActivityController {
  constructor(private readonly logActivityService: LogActivityService) {}

  @Public()
  @Get()
  findAll(@Query() query: LogActivityQueryDto) {
    return this.logActivityService.findAll(query);
  }

  @Public()
  @Get('count')
  count() {
    return this.logActivityService.count();
  }
}
