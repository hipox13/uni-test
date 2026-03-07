import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { UpdateContentBlockDto } from './dto/update-content-block.dto';

@Injectable()
export class ContentBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const blocks = await this.prisma.redevContentBlock.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return blocks.map((b) => ({ ...b, id: Number(b.id) }));
  }

  async findOne(id: number) {
    const block = await this.prisma.redevContentBlock.findUnique({
      where: { id },
    });
    if (!block) throw new NotFoundException(`Content block ${id} not found`);
    return { ...block, id: Number(block.id) };
  }

  async create(dto: CreateContentBlockDto) {
    const slug =
      dto.slug ?? dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const block = await this.prisma.redevContentBlock.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        body: dto.body,
        authorId: dto.authorId,
      },
    });
    return { ...block, id: Number(block.id) };
  }

  async update(id: number, dto: UpdateContentBlockDto) {
    await this.findOne(id);
    const block = await this.prisma.redevContentBlock.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
      },
    });
    return { ...block, id: Number(block.id) };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.redevContentBlock.delete({ where: { id } });
    return { deleted: true };
  }
}
