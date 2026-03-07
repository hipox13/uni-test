import { IsString, IsOptional } from "class-validator";

export class CreateLogoDto {
    @IsString()
    title: string //fe. "UNICEF Logo - Blue"

    @IsString()
    @IsOptional()
    language?: string //fe. "English"

    @IsOptional()
    parentId?: string
}