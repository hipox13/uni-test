import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying media list.
 */
export class MediaQueryDto {
  @IsOptional()
  @IsString()
  type?: string; // Filter by mediaType (e.g., 'image', 'application/pdf')

  @IsOptional()
  @IsString()
  search?: string; // Search in name, title, caption

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
