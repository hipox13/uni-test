import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { validateBlocksOrThrow } from './block-registry';
import { slugify } from '../../../shared/utils/slugify';
import * as crypto from 'crypto';

const STATUS = { DRAFT: 0, REVIEW: 1, PUBLISHED: 2 } as const;

const USER_SELECT = { select: { id: true, name: true, email: true } } as const;
const WITH_USERS = { author: USER_SELECT, modifier: USER_SELECT } as const;

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) { }

  private buildWhere(query: PageQueryDto) {
    const where: any = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private async ensureSlugUnique(slug: string, excludeId?: bigint) {
    const existing = await this.prisma.uniPage.findFirst({
      where: {
        slug,
        status: STATUS.PUBLISHED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already used by a published page`);
    }
  }

  private mergeMetaData(dto: CreatePageDto | UpdatePageDto, existingJson?: string | null): string | null {
    let meta: any = {};
    if (existingJson) {
      try { meta = JSON.parse(existingJson); } catch { }
    }
    if (dto.metaData) {
      try { meta = { ...meta, ...JSON.parse(dto.metaData) }; } catch { }
    }
    const seo: any = {};
    if (dto.metaTitle !== undefined) seo.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) seo.metaDescription = dto.metaDescription;
    if (dto.ogImage !== undefined) seo.ogImage = dto.ogImage;
    if (dto.canonicalUrl !== undefined) seo.canonicalUrl = dto.canonicalUrl;
    meta = { ...meta, ...seo };
    if (dto.customCss !== undefined) meta.customCss = dto.customCss;
    if (dto.customJs !== undefined) meta.customJs = dto.customJs;
    return Object.keys(meta).length > 0 ? JSON.stringify(meta) : null;
  }

  private async createVersion(pageId: bigint, userId: number) {
    const page = await this.prisma.uniPage.findUnique({ where: { id: pageId } });
    if (!page) return;
    const version = await this.prisma.uniPageVersion.count({ where: { pageId } });
    await this.prisma.uniPageVersion.create({
      data: {
        pageId,
        title: page.title,
        slug: page.slug,
        body: page.body,
        version: version + 1,
        authorId: userId,
        createdAt: new Date(),
      },
    });
  }

  async findAll(query: PageQueryDto) {
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.prisma.uniPage.findMany({
        where,
        include: WITH_USERS,
        orderBy: { dateModified: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.uniPage.count({ where }),
    ]);
    return { data, meta: { total, limit: query.limit, offset: query.offset } };
  }

  async findOne(id: bigint) {
    const page = await this.prisma.uniPage.findUnique({ where: { id }, include: WITH_USERS });
    if (!page) throw new NotFoundException(`Page with ID ${id} not found`);
    return page;
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.uniPage.findFirst({
      where: { slug, status: STATUS.PUBLISHED },
      include: { author: USER_SELECT },
    });
    if (!page) throw new NotFoundException(`Published page with slug "${slug}" not found`);
    return page;
  }

  async create(dto: CreatePageDto, userId: number) {
    validateBlocksOrThrow(dto.body);
    const slug = dto.slug || slugify(dto.title);
    await this.ensureSlugUnique(slug);

    const page = await this.prisma.uniPage.create({
      data: {
        title: dto.title,
        slug,
        body: dto.body || null,
        description: dto.description || null,
        keywords: dto.keywords || null,
        metaData: this.mergeMetaData(dto),
        status: dto.status ?? STATUS.DRAFT,
        datePublished: (dto.datePublished && dto.datePublished.trim()) ? new Date(dto.datePublished) : null,
        dateUnpublished: (dto.dateUnpublished && dto.dateUnpublished.trim()) ? new Date(dto.dateUnpublished) : null,
        dateInactive: (dto.dateInactive && dto.dateInactive.trim()) ? new Date(dto.dateInactive) : null,
        trash: dto.trash ?? 0,
        authorId: userId,
        dateCreated: new Date(),
        dateModified: new Date(),
      },
      include: { author: USER_SELECT },
    });

    await this.createVersion(page.id, userId);
    return page;
  }

  async update(id: bigint, dto: UpdatePageDto, userId: number) {
    const page = await this.findOne(id);

    if (dto.body !== undefined) validateBlocksOrThrow(dto.body);
    if (dto.slug && dto.slug !== page.slug) await this.ensureSlugUnique(dto.slug, id);

    const updateData: any = { modifierId: userId, dateModified: new Date() };
    const fields = ['title', 'slug', 'body', 'description', 'keywords', 'status'] as const;
    for (const key of fields) {
      if ((dto as any)[key] !== undefined) updateData[key] = (dto as any)[key];
    }

    // Handle dates safely
    if (dto.datePublished !== undefined) {
      updateData.datePublished = (dto.datePublished && dto.datePublished.trim()) ? new Date(dto.datePublished) : null;
    }
    if (dto.dateUnpublished !== undefined) {
      updateData.dateUnpublished = (dto.dateUnpublished && dto.dateUnpublished.trim()) ? new Date(dto.dateUnpublished) : null;
    }
    if (dto.dateInactive !== undefined) {
      updateData.dateInactive = (dto.dateInactive && dto.dateInactive.trim()) ? new Date(dto.dateInactive) : null;
    }

    const hasSeoChanges = [dto.metaTitle, dto.metaDescription, dto.ogImage, dto.canonicalUrl, dto.metaData]
      .some((v) => v !== undefined);
    if (hasSeoChanges) {
      updateData.metaData = this.mergeMetaData(dto, page.metaData);
    }

    const updated = await this.prisma.uniPage.update({
      where: { id },
      data: updateData,
      include: WITH_USERS,
    });

    await this.createVersion(updated.id, userId);
    return updated;
  }

  async duplicate(id: bigint, userId: number) {
    const src = await this.findOne(id);
    return this.prisma.uniPage.create({
      data: {
        title: src.title ? `${src.title} (Copy)` : 'Untitled (Copy)',
        slug: `${src.slug || slugify(src.title || 'untitled')}-copy`,
        body: src.body,
        description: src.description,
        keywords: src.keywords,
        metaData: src.metaData,
        status: STATUS.DRAFT,
        authorId: userId,
        dateCreated: new Date(),
        dateModified: new Date(),
      },
      include: { author: USER_SELECT },
    });
  }

  async publish(id: bigint, userId: number) {
    const page = await this.findOne(id);
    if (page.status === STATUS.PUBLISHED) throw new BadRequestException('Page is already published');
    if (!page.slug) throw new BadRequestException('Cannot publish page without a slug');
    await this.ensureSlugUnique(page.slug, id);

    return this.prisma.uniPage.update({
      where: { id },
      data: { status: STATUS.PUBLISHED, datePublished: new Date(), dateModified: new Date(), modifierId: userId },
      include: WITH_USERS,
    });
  }

  async unpublish(id: bigint, userId: number) {
    const page = await this.findOne(id);
    if (page.status !== STATUS.PUBLISHED) throw new BadRequestException('Page is not published');

    return this.prisma.uniPage.update({
      where: { id },
      data: { status: STATUS.DRAFT, dateModified: new Date(), modifierId: userId },
      include: WITH_USERS,
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    await this.prisma.uniPage.delete({ where: { id } });
    return { message: `Page ${id} deleted successfully` };
  }

  async generatePreviewToken(pageId: bigint, userId: number, expiresInMinutes = 60) {
    const page = await this.findOne(pageId);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await this.prisma.uniUserReqtoken.create({
      data: {
        authType: 1,
        authToken: token,
        userId,
        dateCreated: new Date(),
        dateExpired: expiresAt,
        requestData: JSON.stringify({ pageId: pageId.toString() }),
      },
    });

    return { token, expiresAt, previewUrl: `/api/v1/content/preview?token=${token}` };
  }

  async getPreviewByToken(token: string) {
    const record = await this.prisma.uniUserReqtoken.findFirst({
      where: { authToken: token, authType: 1, dateExpired: { gt: new Date() } },
    });
    if (!record) throw new UnauthorizedException('Invalid or expired preview token');

    let pageId: bigint;
    try {
      pageId = BigInt(JSON.parse(record.requestData || '{}').pageId);
    } catch {
      throw new UnauthorizedException('Invalid preview token data');
    }

    const page = await this.prisma.uniPage.findUnique({
      where: { id: pageId },
      include: { author: USER_SELECT },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async findVersions(pageId: bigint) {
    return this.prisma.uniPageVersion.findMany({
      where: { pageId },
      include: { author: USER_SELECT },
      orderBy: { version: 'desc' },
    });
  }

  async getAnyUserId(): Promise<number> {
    const user = await this.prisma.uniUser.findFirst();
    return user?.id ?? 1;
  }
}
