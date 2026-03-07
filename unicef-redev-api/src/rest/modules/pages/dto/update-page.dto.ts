import { IsOptional, IsIn, IsString, Matches, MaxLength, MinLength, IsUrl, IsInt, IsDateString } from 'class-validator';

/**
 * DTO for updating a page.
 * Only draft (0) and review (1) pages can be updated.
 */
export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

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
  @IsIn([0, 1, 2], { message: 'Status can only be draft (0), review (1), or published (2)' })
  status?: number; // 0 = draft, 1 = review, 2 = published

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
