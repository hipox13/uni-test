import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Public()
    @Get()
    async getAll() {
        return this.settingsService.findAll();
    }

    @Public()
    @Get('system-info')
    getSystemInfo() {
        return this.settingsService.getSystemInfo();
    }

    @Public()
    @Get('media')
    getMediaSettings() {
        return this.settingsService.getMediaSettings();
    }

    @Public()
    @Get(':scope')
    async getByScope(@Param('scope') scope: string) {
        return this.settingsService.findByScope(scope);
    }

    @Public()
    @Patch()
    async update(@Body() dto: UpdateSettingsDto) {
        return this.settingsService.updateBulk(dto);
    }
}
