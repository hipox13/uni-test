import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for querying menus.
 */
export class MenuQueryDto {
  @IsOptional()
  @IsString()
  groupName?: string; // Filter by menu group (e.g., 'main', 'footer')
}
