import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LogosService } from './logos.service';
import { CreateLogoDto } from './dto/create-logo.dto';

@Controller('api/v1/logos')
export class LogosController {
    constructor(private readonly logosService: LogosService) { }

    @Get()
    async getLogos() {
        return this.logosService.findAll()
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateLogoDto
    ) {
        const defaultUserId = 1;
        return this.logosService.create(file, dto, defaultUserId)
    }
}