import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class LogActivityQueryDto {
  @IsOptional()
  @IsString()
  feature?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  offset?: number = 0;
}
