import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { MenuTreeItem } from './menus.types';
import { buildMenuTree } from './menus.utils';

const USER_SELECT = { select: { id: true, name: true, email: true } } as const;
const WITH_USERS = { author: USER_SELECT, modifier: USER_SELECT } as const;

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  private async queryMenus(query: MenuQueryDto) {
    const where: any = {};
    if (query.groupName) where.groupName = query.groupName;
    return this.prisma.uniMenu.findMany({
      where, include: WITH_USERS, orderBy: { ordering: 'asc' },
    });
  }

  async findAll(query: MenuQueryDto) {
    const menus = await this.queryMenus(query);
    return { data: buildMenuTree(menus as MenuTreeItem[]) };
  }

  async findAllFlat(query: MenuQueryDto) {
    return { data: await this.queryMenus(query) };
  }

  async findPublic(groupName?: string) {
    const where: any = { status: 1 };
    if (groupName) where.groupName = groupName;
    const menus = await this.prisma.uniMenu.findMany({
      where,
      select: { id: true, parent: true, groupName: true, title: true, href: true, target: true, svgIcon: true, ordering: true },
      orderBy: { ordering: 'asc' },
    });
    return { data: buildMenuTree(menus as MenuTreeItem[]) };
  }

  async findOne(id: number) {
    const menu = await this.prisma.uniMenu.findUnique({
      where: { id },
      include: { ...WITH_USERS, parentMenu: true, children: true },
    });
    if (!menu) throw new NotFoundException(`Menu with ID ${id} not found`);
    return menu;
  }

  async create(dto: CreateMenuDto, userId?: number) {
    if (dto.parentId) {
      const parent = await this.prisma.uniMenu.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new BadRequestException(`Parent menu with ID ${dto.parentId} not found`);
    }

    const maxOrdering = await this.prisma.uniMenu.findFirst({
      where: { groupName: dto.groupName || null, parent: dto.parentId || null },
      orderBy: { ordering: 'desc' },
      select: { ordering: true },
    });

    return this.prisma.uniMenu.create({
      data: {
        title: dto.title, href: dto.href || null, target: dto.target || null,
        groupName: dto.groupName || null, parent: dto.parentId || null,
        ordering: dto.ordering ?? (maxOrdering?.ordering ?? 0) + 1,
        svgIcon: dto.svgIcon || null, status: 1,
        posX: dto.posX ?? 0, posY: dto.posY ?? 0,
        authorId: userId || null, dateCreated: new Date(), dateModified: new Date(),
      },
      include: { author: USER_SELECT },
    });
  }

  async update(id: number, dto: UpdateMenuDto, userId: number) {
    const menu = await this.findOne(id);

    if (dto.parentId !== undefined && dto.parentId !== menu.parent) {
      if (dto.parentId === id) throw new BadRequestException('Menu cannot be its own parent');
      let cur: number | null = dto.parentId;
      while (cur) {
        const p = await this.prisma.uniMenu.findUnique({ where: { id: cur }, select: { id: true, parent: true } });
        if (!p) break;
        if (p.parent === id) throw new BadRequestException('Circular reference detected');
        cur = p.parent;
      }
    }

    const data: any = { modifierId: userId, dateModified: new Date() };
    for (const [dtoKey, dbKey] of [
      ['title', 'title'], ['href', 'href'], ['target', 'target'],
      ['groupName', 'groupName'], ['parentId', 'parent'],
      ['ordering', 'ordering'], ['svgIcon', 'svgIcon'],
      ['posX', 'posX'], ['posY', 'posY'],
    ] as const) {
      if ((dto as any)[dtoKey] !== undefined) data[dbKey] = (dto as any)[dtoKey];
    }

    return this.prisma.uniMenu.update({ where: { id }, data, include: WITH_USERS });
  }

  async remove(id: number) {
    const menu = await this.findOne(id);
    await this.prisma.uniMenu.updateMany({ where: { parent: id }, data: { parent: menu.parent } });
    await this.prisma.uniMenu.delete({ where: { id } });
    return { message: `Menu ${id} deleted successfully` };
  }

  async reorder(dto: ReorderMenuDto) {
    return this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.uniMenu.update({ where: { id: item.id }, data: { parent: item.parentId, ordering: item.ordering } }),
      ),
    );
  }

  private async bulkUpdateStatus(ids: number[], status: number) {
    const result = await this.prisma.uniMenu.updateMany({ where: { id: { in: ids } }, data: { status } });
    return { affected: result.count };
  }

  async bulkPublish(ids: number[]) { return this.bulkUpdateStatus(ids, 1); }
  async bulkUnpublish(ids: number[]) { return this.bulkUpdateStatus(ids, 0); }

  async bulkDelete(ids: number[]) {
    await this.prisma.uniMenu.updateMany({ where: { parent: { in: ids } }, data: { parent: null } });
    const result = await this.prisma.uniMenu.deleteMany({ where: { id: { in: ids } } });
    return { affected: result.count };
  }
}
