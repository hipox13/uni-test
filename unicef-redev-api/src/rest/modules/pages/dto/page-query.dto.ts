import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying pages list.
 */
export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1, 2], { message: 'Status must be 0 (draft), 1 (review), or 2 (published)' })
  status?: number;

  @IsOptional()
  @IsString()
  search?: string; // Search in title, slug, description

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
