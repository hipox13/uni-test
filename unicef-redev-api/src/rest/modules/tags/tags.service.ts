import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.uniTag.findMany({
            orderBy: { title: 'asc' },
        });
    }

    async findOne(id: number) {
        const tag = await this.prisma.uniTag.findUnique({
            where: { id },
        });
        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }
        return tag;
    }

    async create(dto: CreateTagDto) {
        const slug = dto.slug || dto.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        return this.prisma.uniTag.create({
            data: {
                ...dto,
                slug,
            },
        });
    }

    async update(id: number, dto: UpdateTagDto) {
        await this.findOne(id);
        return this.prisma.uniTag.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.uniTag.delete({
            where: { id },
        });
        return { message: `Tag with ID ${id} deleted successfully` };
    }

    /**
     * Assign tags to a media item.
     * Stores tag titles as comma-separated string in uni_media.labels.
     */
    async assignToMedia(mediaId: bigint, tagIds: number[]) {
        const media = await this.prisma.uniMedia.findUnique({ where: { id: mediaId } });
        if (!media) throw new NotFoundException(`Media ${mediaId} not found`);

        const tags = await this.prisma.uniTag.findMany({
            where: { id: { in: tagIds } },
        });
        if (tags.length === 0) throw new BadRequestException('No valid tags found');

        const existingLabels = media.labels
            ? media.labels.split(',').map((l) => l.trim()).filter(Boolean)
            : [];

        const newLabels = tags.map((t) => t.title ?? '').filter(Boolean);
        const merged = [...new Set([...existingLabels, ...newLabels])];

        await this.prisma.uniMedia.update({
            where: { id: mediaId },
            data: { labels: merged.join(',') },
        });

        return { mediaId: mediaId.toString(), labels: merged };
    }

    async removeFromMedia(mediaId: bigint, tagIds: number[]) {
        const media = await this.prisma.uniMedia.findUnique({ where: { id: mediaId } });
        if (!media) throw new NotFoundException(`Media ${mediaId} not found`);

        const tags = await this.prisma.uniTag.findMany({
            where: { id: { in: tagIds } },
        });
        const titlesToRemove = new Set(tags.map((t) => t.title ?? ''));

        const existingLabels = media.labels
            ? media.labels.split(',').map((l) => l.trim()).filter(Boolean)
            : [];

        const filtered = existingLabels.filter((l) => !titlesToRemove.has(l));
        const result = filtered.length > 0 ? filtered.join(',') : undefined;

        await this.prisma.uniMedia.update({
            where: { id: mediaId },
            data: { labels: result },
        });

        return { mediaId: mediaId.toString(), labels: filtered };
    }

    async findMediaByTag(tagId: number) {
        const tag = await this.findOne(tagId);
        if (!tag.title) throw new BadRequestException('Tag has no title');

        const media = await this.prisma.uniMedia.findMany({
            where: {
                labels: { contains: tag.title, mode: 'insensitive' },
            },
            orderBy: { datePosted: 'desc' },
            take: 50,
        });

        return { tag, media };
    }
}
