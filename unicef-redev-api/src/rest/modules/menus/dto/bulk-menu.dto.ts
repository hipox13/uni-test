import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class BulkMenuDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  ids: number[];
}
