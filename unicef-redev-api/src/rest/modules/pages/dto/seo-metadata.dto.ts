import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

/**
 * SEO metadata structure (stored in page.metaData JSON).
 */
export class SeoMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string; // SEO title (can differ from page title)

  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string; // SEO description (can differ from page description)

  @IsOptional()
  @IsUrl()
  ogImage?: string; // Open Graph image URL

  @IsOptional()
  @IsUrl()
  canonicalUrl?: string; // Canonical URL

  @IsOptional()
  @IsString()
  ogTitle?: string; // Open Graph title

  @IsOptional()
  @IsString()
  ogDescription?: string; // Open Graph description

  @IsOptional()
  @IsString()
  twitterCard?: string; // 'summary', 'summary_large_image', etc.

  @IsOptional()
  @IsString()
  noindex?: boolean; // Set to true to prevent indexing
}
