import { IsString, IsOptional, Matches, MaxLength, MinLength, IsUrl, IsInt, IsDateString } from 'class-validator';

/**
 * DTO for creating a new page (draft).
 */
export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  body?: string; // JSON string of blocks array

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  keywords?: string;

  // SEO fields
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string; // SEO title (can differ from page title)

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string; // SEO meta description

  @IsOptional()
  @IsUrl()
  ogImage?: string; // Open Graph image URL

  @IsOptional()
  @IsUrl()
  canonicalUrl?: string; // Canonical URL

  @IsOptional()
  @IsString()
  metaData?: string; // JSON string for additional metadata (can include SEO, OG tags, etc.)

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsDateString()
  datePublished?: string;

  @IsOptional()
  @IsDateString()
  dateUnpublished?: string;

  @IsOptional()
  @IsDateString()
  dateInactive?: string;

  @IsOptional()
  @IsInt()
  trash?: number;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsString()
  customJs?: string;
}
