import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class AssignTagDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  tagIds: number[];
}
