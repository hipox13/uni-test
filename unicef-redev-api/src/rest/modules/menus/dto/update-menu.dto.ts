import { IsOptional, IsString, IsInt, MaxLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating a menu item.
 */
export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  href?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  target?: string; // e.g., '_blank', '_self'

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string; // e.g., 'main', 'footer', 'sidebar'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number; // Parent menu item ID (for hierarchy)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ordering?: number; // Display order

  @IsOptional()
  @IsString()
  svgIcon?: string; // SVG icon code or path

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  posX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  posY?: number;
}
