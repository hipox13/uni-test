import { IsString, IsUrl, IsOptional, MaxLength } from 'class-validator';

export class EmbedVideoDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsUrl()
    url: string;

    @IsString()
    @IsOptional()
    caption?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
