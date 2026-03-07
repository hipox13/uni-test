import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export/pdf')
  async exportPdf(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.reportsService.exportPdf(dateFrom, dateTo);
  }

  @Get('export/excel')
  async exportExcel(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.reportsService.exportExcel(dateFrom, dateTo);
  }
}
