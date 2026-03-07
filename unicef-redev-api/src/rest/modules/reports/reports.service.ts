import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportPdf(_dateFrom: string, _dateTo: string) {
    // TODO: generate PDF; for heavy work consider moving to Worker
    return { message: 'PDF export not implemented yet' };
  }

  async exportExcel(_dateFrom: string, _dateTo: string) {
    return { message: 'Excel export not implemented yet' };
  }
}
