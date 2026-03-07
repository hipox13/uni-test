import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SettingItemDto {
    @IsString()
    metaKey: string;

    @IsString()
    metaValue: string;
}

export class UpdateSettingsDto {
    @IsString()
    scope: string; // e.g., 'general', 'social', 'contact'

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SettingItemDto)
    items: SettingItemDto[];
}
