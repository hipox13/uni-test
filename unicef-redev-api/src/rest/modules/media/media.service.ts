import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { MediaQueryDto } from './dto/media-query.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { EmbedVideoDto } from './dto/embed-video.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const AUTHOR_SELECT = { select: { id: true, name: true, email: true } } as const;
const WITH_AUTHOR = { author: AUTHOR_SELECT } as const;

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private mediaUrl(name: string | null): string {
    if (!name) return '';
    return name.startsWith('http') ? name : `/uploads/${name}`;
  }

  private addUrls(item: any) {
    const urls: any = { url: this.mediaUrl(item.name) };
    if (item.metaData) {
      try {
        const meta = JSON.parse(item.metaData);
        if (meta.thumbnail) urls.thumbnailUrl = `/uploads/${meta.thumbnail}`;
      } catch {}
    }
    return { ...item, ...urls };
  }

  private generateFilePath(originalName: string) {
    const now = new Date();
    const dir = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const filename = `${crypto.randomUUID()}${path.extname(originalName)}`;
    const fullDir = path.join(this.uploadDir, dir);
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
    return {
      relativePath: path.join(dir, filename),
      fullPath: path.join(fullDir, filename),
    };
  }

  private async optimizeImage(
    buffer: Buffer,
    opts: { width?: number; format?: 'webp' | 'avif'; quality?: number } = {},
  ) {
    const { width, format = 'webp', quality = 80 } = opts;
    let pipeline = sharp(buffer);
    const meta = await pipeline.metadata();
    
    const targetWidth = width && meta.width && meta.width > width ? width : undefined;
    
    if (targetWidth) {
      pipeline = pipeline.resize(targetWidth, null, { 
        withoutEnlargement: true, 
        fit: 'inside' 
      });
    }

    if (format === 'avif') {
      pipeline = pipeline.avif({ quality, effort: 2 });
    } else {
      pipeline = pipeline.webp({ quality });
    }

    return { 
      buffer: await pipeline.toBuffer(), 
      extension: format, 
      mimeType: `image/${format}` 
    };
  }

  private buildWhere(query: MediaQueryDto) {
    const where: any = {};
    if (query.type) where.mediaType = { contains: query.type, mode: 'insensitive' };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { caption: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findAll(query: MediaQueryDto) {
    const where = this.buildWhere(query);
    const [media, total] = await Promise.all([
      this.prisma.uniMedia.findMany({
        where, include: WITH_AUTHOR,
        orderBy: { datePosted: 'desc' },
        take: query.limit, skip: query.offset,
      }),
      this.prisma.uniMedia.count({ where }),
    ]);
    return {
      data: media.map((m) => this.addUrls(m)),
      meta: { total, limit: query.limit, offset: query.offset },
    };
  }

  async findOne(id: bigint) {
    const media = await this.prisma.uniMedia.findUnique({ where: { id }, include: WITH_AUTHOR });
    if (!media) throw new NotFoundException(`Media with ID ${id} not found`);
    return this.addUrls(media);
  }

  async upload(file: Express.Multer.File, userId: number, labels?: string): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    let { relativePath, fullPath } = this.generateFilePath(file.originalname);
    let buffer = file.buffer;
    let mimeType = file.mimetype;
    let extension = path.extname(file.originalname).slice(1);
    const metaData: any = { variants: {} };

    const isRasterImage = file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml';
    
    if (isRasterImage) {
      // 1. Convert main image to WebP
      const webpMain = await this.optimizeImage(file.buffer, { format: 'webp' });
      const webpRelPath = relativePath.replace(path.extname(relativePath), '.webp');
      fs.writeFileSync(path.join(this.uploadDir, webpRelPath), webpMain.buffer);
      
      relativePath = webpRelPath;
      buffer = webpMain.buffer;
      mimeType = webpMain.mimeType;
      extension = webpMain.extension;

      // 2. Asset Pipeline: Generate AVIF and various sizes
      const sizes = [
        { name: 'thumb', width: 300 },
        { name: 'medium', width: 800 },
        { name: 'large', width: 1600 }
      ];
      const formats: Array<'webp' | 'avif'> = ['webp', 'avif'];

      for (const format of formats) {
        metaData.variants[format] = {};
        for (const size of sizes) {
          const optimized = await this.optimizeImage(file.buffer, { 
            width: size.width, 
            format 
          });
          const variantRelPath = relativePath.replace('.webp', `-${size.name}.${format}`);
          fs.writeFileSync(path.join(this.uploadDir, variantRelPath), optimized.buffer);
          metaData.variants[format][size.name] = variantRelPath;
        }
        
        if (format === 'avif') {
          const mainAvif = await this.optimizeImage(file.buffer, { format: 'avif' });
          const avifRelPath = relativePath.replace('.webp', '.avif');
          fs.writeFileSync(path.join(this.uploadDir, avifRelPath), mainAvif.buffer);
          metaData.variants.avif.main = avifRelPath;
        }
      }
      
      metaData.thumbnail = metaData.variants.webp.thumb;
    } else {
      fs.writeFileSync(fullPath, buffer);
    }

    const media = await this.prisma.uniMedia.create({
      data: {
        name: relativePath,
        title: file.originalname,
        extension,
        fileSize: buffer.length,
        mediaType: mimeType,
        authorId: userId,
        datePosted: new Date(),
        status: 1,
        labels: labels || null,
        metaData: JSON.stringify(metaData),
      },
      include: WITH_AUTHOR,
    });

    return {
      id: media.id,
      name: media.name,
      title: media.title,
      url: `/uploads/${media.name}`,
      mediaType: media.mediaType,
      fileSize: media.fileSize,
      extension: media.extension,
      datePosted: media.datePosted,
    };
  }

  async update(id: bigint, dto: UpdateMediaDto) {
    await this.findOne(id);
    const data: any = {};
    for (const key of ['title', 'caption', 'description', 'labels'] as const) {
      if ((dto as any)[key] !== undefined) data[key] = (dto as any)[key];
    }
    const updated = await this.prisma.uniMedia.update({ where: { id }, data, include: WITH_AUTHOR });
    return this.addUrls(updated);
  }

  async remove(id: bigint) {
    const media = await this.findOne(id);
    if (media.name && !media.name.startsWith('http')) {
      const mainPath = path.join(this.uploadDir, media.name);
      if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
      
      if (media.metaData) {
        try {
          const meta = JSON.parse(media.metaData);
          
          if (meta.variants) {
            Object.values(meta.variants).forEach((formatGroup: any) => {
              Object.values(formatGroup).forEach((variantPath: any) => {
                const p = path.join(this.uploadDir, variantPath);
                if (fs.existsSync(p)) fs.unlinkSync(p);
              });
            });
          }
          
          if (meta.thumbnail && !JSON.stringify(meta.variants || {}).includes(meta.thumbnail)) {
            const thumbPath = path.join(this.uploadDir, meta.thumbnail);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
          }
        } catch {}
      }
    }
    await this.prisma.uniMedia.delete({ where: { id } });
    return { message: `Media ${id} deleted successfully` };
  }

  async cropImage(id: bigint, crop: { left: number; top: number; width: number; height: number }) {
    const media = await this.findOne(id);
    if (!media.mediaType?.startsWith('image/') || media.mediaType === 'image/svg+xml') {
      throw new BadRequestException('Only raster images can be cropped');
    }

    const filePath = path.join(this.uploadDir, media.name!);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Source file not found on disk');

    const cropped = await sharp(fs.readFileSync(filePath))
      .extract({ left: Math.round(crop.left), top: Math.round(crop.top), width: Math.round(crop.width), height: Math.round(crop.height) })
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(filePath, cropped);
    const thumb = await this.optimizeImage(cropped, { width: 300 });
    fs.writeFileSync(filePath.replace('.webp', '-thumb.webp'), thumb.buffer);
    await this.prisma.uniMedia.update({ where: { id }, data: { fileSize: cropped.length } });
    return this.findOne(id);
  }

  async getFilePath(id: bigint) {
    const media = await this.findOne(id);
    if (!media.name || media.name.startsWith('http')) throw new BadRequestException('External media cannot be downloaded');
    const filePath = path.join(this.uploadDir, media.name);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found on disk');
    return { filePath, filename: media.title || path.basename(media.name), mimeType: media.mediaType || 'application/octet-stream' };
  }

  async embedVideo(dto: EmbedVideoDto, userId: number) {
    const media = await this.prisma.uniMedia.create({
      data: {
        name: dto.url, title: dto.title, caption: dto.caption, description: dto.description,
        mediaType: 'video/youtube', authorId: userId, datePosted: new Date(), status: 1, labels: 'video,embed',
      },
      include: WITH_AUTHOR,
    });
    return { ...media, url: media.name };
  }
}
