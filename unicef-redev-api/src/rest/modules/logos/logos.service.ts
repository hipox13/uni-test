import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateLogoDto } from './dto/create-logo.dto';
import { MediaService } from '../media/media.service';

@Injectable()
export class LogosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mediaService: MediaService,
    ) { }

    async findAll() {
        return this.prisma.uniMedia.findMany({
            where: {
                labels: { contains: 'logo' }
            }
        })
    }

    async create(file: Express.Multer.File, dto: CreateLogoDto, userId?: number) {
        const defaultUserId = userId || 1;

        // 1. Upload & Optimize via MediaService
        const uploadResult = await this.mediaService.upload(file, defaultUserId, 'logo');

        // 2. Update specific logo metadata (language/description, parent)
        return this.prisma.uniMedia.update({
            where: { id: uploadResult.id },
            data: {
                description: dto.language, // Map language to description
                parent: dto.parentId ? BigInt(dto.parentId) : null,
            }
        });
    }
}