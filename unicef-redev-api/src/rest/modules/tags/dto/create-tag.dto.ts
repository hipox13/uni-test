import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateTagDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    slug?: string;

    @IsInt()
    @IsOptional()
    owner?: number;
}
