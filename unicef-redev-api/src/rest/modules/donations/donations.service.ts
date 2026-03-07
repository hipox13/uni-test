import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { slugify } from '../../../shared/utils/slugify';
import * as crypto from 'crypto';

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.uniDonation.findMany({
      orderBy: { dateCreated: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: number) {
    const donation = await this.prisma.uniDonation.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });
    if (!donation) {
      throw new NotFoundException(`Donation ${id} not found`);
    }
    return donation;
  }

  private mergeMetaData(dto: CreateDonationDto | UpdateDonationDto, currentMeta: string | null): string | null {
    let meta: any = {};
    if (currentMeta) {
      try {
        meta = JSON.parse(currentMeta);
      } catch (e) {
        meta = {};
      }
    }

    if (dto.metaData !== undefined) {
      try {
        const extra = JSON.parse(dto.metaData);
        meta = { ...meta, ...extra };
      } catch (e) {
        // ignore invalid json in metaData field
      }
    }

    if (dto.customCss !== undefined) meta.customCss = dto.customCss;
    if (dto.customJs !== undefined) meta.customJs = dto.customJs;

    return Object.keys(meta).length > 0 ? JSON.stringify(meta) : null;
  }

  async create(dto: CreateDonationDto, userId: number) {
    const slug = dto.slug || slugify(dto.title);
    await this.ensureSlugUnique(slug);

    // Filter out fields that are NOT in the Prisma model
    const { customCss, customJs, ...rest } = dto;

    const donation = await this.prisma.uniDonation.create({
      data: {
        ...rest,
        slug,
        authorId: userId,
        dateCreated: new Date(),
        dateModified: new Date(),
        datePublished: (dto.datePublished && dto.datePublished.trim()) ? new Date(dto.datePublished) : null,
        dateInactive: (dto.dateInactive && dto.dateInactive.trim()) ? new Date(dto.dateInactive) : null,
        metaData: this.mergeMetaData(dto, null),
      },
    });

    await this.createVersion(donation.id, userId);
    return donation;
  }

  async update(id: number, dto: UpdateDonationDto, userId: number) {
    const current = await this.prisma.uniDonation.findUnique({ where: { id } });
    if (!current) throw new Error('Article not found');

    if (dto.slug && dto.slug !== current.slug) {
      await this.ensureSlugUnique(dto.slug, id);
    }

    // Filter out fields that are NOT in the Prisma model
    const { customCss, customJs, ...rest } = dto;

    const updated = await this.prisma.uniDonation.update({
      where: { id },
      data: {
        ...rest,
        modifierId: userId,
        dateModified: new Date(),
        datePublished: (dto.datePublished && dto.datePublished.trim()) ? new Date(dto.datePublished) : (dto as any).status === 2 ? new Date() : current.datePublished,
        dateInactive: (dto.dateInactive && dto.dateInactive.trim()) ? new Date(dto.dateInactive) : current.dateInactive,
        metaData: this.mergeMetaData(dto, current.metaData),
      },
    });

    await this.createVersion(id, userId);
    return updated;
  }

  async remove(id: number) {
    await this.prisma.uniDonation.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Snapshot versioning
   */
  private async createVersion(donationId: number, userId: number) {
    const donation = await this.prisma.uniDonation.findUnique({ where: { id: donationId } });
    if (!donation) return;

    const versionCount = await this.prisma.uniDonationVersion.count({ where: { donationId } });

    await this.prisma.uniDonationVersion.create({
      data: {
        donationId,
        title: donation.title,
        body: donation.body,
        version: versionCount + 1,
        authorId: userId,
        createdAt: new Date(),
      },
    });
  }

  async findVersions(donationId: number) {
    return this.prisma.uniDonationVersion.findMany({
      where: { donationId },
      orderBy: { version: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const donation = await this.prisma.uniDonation.findFirst({
      where: { slug, status: 2 },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
    if (!donation) {
      throw new NotFoundException(`Article with slug ${slug} not found`);
    }
    return donation;
  }

  private async ensureSlugUnique(slug: string, id?: number) {
    const existing = await this.prisma.uniDonation.findFirst({
      where: {
        slug,
        id: id ? { not: id } : undefined,
      },
    });
    if (existing) {
      throw new Error(`Slug "${slug}" is already in use by another article`);
    }
  }

  async getAnyUserId(): Promise<number> {
    const user = await this.prisma.uniUser.findFirst();
    return user?.id ?? 1;
  }

  async generatePreviewToken(donationId: number, userId: number, expiresInMinutes = 60) {
    const donation = await this.findOne(donationId);

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
        requestData: JSON.stringify({ donationId: donationId.toString() }),
      },
    });

    return { token, expiresAt, previewUrl: `/api/v1/content/preview?token=${token}&type=article` };
  }

  async getPreviewByToken(token: string) {
    const record = await this.prisma.uniUserReqtoken.findFirst({
      where: { authToken: token, authType: 1, dateExpired: { gt: new Date() } },
    });
    if (!record) throw new Error('Invalid or expired preview token');

    let donationId: number;
    try {
      const data = JSON.parse(record.requestData || '{}');
      donationId = Number(data.donationId);
      if (!donationId || isNaN(donationId)) {
        throw new Error('Missing or invalid donationId');
      }
    } catch (err) {
      throw new BadRequestException('Invalid preview token data');
    }

    const donation = await this.prisma.uniDonation.findUnique({
      where: { id: donationId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    if (!donation) throw new NotFoundException('Article not found');
    return donation;
  }
}
