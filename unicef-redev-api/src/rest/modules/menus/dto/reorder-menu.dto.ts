import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
    @IsInt()
    id: number

    @IsOptional()
    @IsInt()
    parentId: number | null

    @IsInt()
    ordering: number
}

export class ReorderMenuDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItem)
    items: ReorderItem[];
}