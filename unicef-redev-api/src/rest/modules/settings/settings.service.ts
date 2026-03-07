import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const MEDIA_DEFAULTS = {
    maxUploadSize: '52428800',
    thumbnailWidth: '300',
    mediumWidth: '800',
    largeWidth: '2000',
    imageQuality: '80',
    imageFormat: 'webp',
    allowedTypes: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,video/mp4,video/quicktime,video/x-msvideo,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm',
};

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        const metadata = await this.prisma.uniMetadata.findMany({
            where: { status: 1 },
        });

        return metadata.reduce((acc, curr) => {
            const scope = curr.scope || 'general';
            if (!acc[scope]) acc[scope] = {};
            if (curr.metaKey) {
                acc[scope][curr.metaKey] = curr.metaValue;
            }
            return acc;
        }, {} as Record<string, Record<string, string | null>>);
    }

    async findByScope(scope: string) {
        const metadata = await this.prisma.uniMetadata.findMany({
            where: { scope, status: 1 },
        });

        return metadata.reduce((acc, curr) => {
            if (curr.metaKey) {
                acc[curr.metaKey] = curr.metaValue;
            }
            return acc;
        }, {} as Record<string, string | null>);
    }

    async updateBulk(dto: UpdateSettingsDto) {
        const { scope, items } = dto;
        const results: any[] = [];

        for (const item of items) {
            const existing = await this.prisma.uniMetadata.findFirst({
                where: { scope, metaKey: item.metaKey },
            });

            if (existing) {
                results.push(
                    await this.prisma.uniMetadata.update({
                        where: { id: existing.id },
                        data: { metaValue: item.metaValue },
                    }),
                );
            } else {
                results.push(
                    await this.prisma.uniMetadata.create({
                        data: {
                            scope,
                            metaKey: item.metaKey,
                            metaValue: item.metaValue,
                            status: 1,
                        },
                    }),
                );
            }
        }
        return results;
    }

    /**
     * Get media-specific settings with defaults.
     */
    async getMediaSettings(): Promise<Record<string, string>> {
        const dbSettings = await this.findByScope('media');

        return {
            ...MEDIA_DEFAULTS,
            ...Object.fromEntries(
                Object.entries(dbSettings).filter(([, v]) => v !== null),
            ) as Record<string, string>,
        };
    }

    async getSystemInfo() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            database: 'PostgreSQL',
            environment: process.env.NODE_ENV || 'development',
            serverTime: new Date().toISOString(),
            uptime: `${hours}h ${minutes}m`,
            memoryUsage: {
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            },
            status: 'Operational',
        };
    }
}
