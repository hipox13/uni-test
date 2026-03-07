import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating media metadata.
 */
export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  labels?: string; // Comma-separated tags
}
