import { IsOptional, IsInt, IsString, Min } from 'class-validator';

export class DonorQueryDto {
  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
