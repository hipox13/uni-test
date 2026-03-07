import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for generating preview token.
 */
export class GeneratePreviewTokenDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiresInMinutes?: number = 60; // Default: 1 hour
}
