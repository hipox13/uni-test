import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PagesService } from '../pages/pages.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagesService: PagesService,
  ) {}

  async generateSitemap(baseUrl = 'https://example.com'): Promise<string> {
    const pages = await this.prisma.uniPage.findMany({
      where: { status: 2 },
      select: { slug: true, dateModified: true },
      orderBy: { dateModified: 'desc' },
    });

    const urls = pages
      .map((p) => {
        const lastmod = p.dateModified?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
        return `  <url>\n    <loc>${baseUrl}/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }

  async generateRobots(): Promise<string> {
    return `User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml`;
  }

  async getPreviewByToken(token: string) {
    return this.pagesService.getPreviewByToken(token);
  }
}
