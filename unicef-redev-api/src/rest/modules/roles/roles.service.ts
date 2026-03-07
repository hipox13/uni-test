import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    const roles = await this.prisma.uniUserRole.findMany({
      include: {
        rolePerms: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { id: 'asc' },
    });
    return roles.map((role) => this.mapRolePermissions(role));
  }

  async findOne(id: number) {
    const role = await this.prisma.uniUserRole.findUnique({
      where: { id },
      include: {
        rolePerms: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return this.mapRolePermissions(role);
  }

  private mapRolePermissions(role: any) {
    const { rolePerms, ...rest } = role;
    return {
      ...rest,
      permissions: rolePerms?.map((rp: any) => rp.permission).filter(Boolean) ?? [],
    };
  }

  async create(dto: CreateRoleDto) {
    const role = await this.prisma.uniUserRole.create({
      data: { title: dto.title, name: dto.name, groupName: dto.groupName },
    });
    return this.mapRolePermissions(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    await this.findOne(id);
    const role = await this.prisma.uniUserRole.update({
      where: { id },
      data: dto,
      include: {
        rolePerms: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    return this.mapRolePermissions(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    if (role._count.users > 0) {
      throw new ConflictException(
        `Cannot delete role #${id}: ${role._count.users} user(s) still assigned`,
      );
    }
    await this.prisma.uniRolePermissionsV2.deleteMany({ where: { roleId: id } });
    return this.prisma.uniUserRole.delete({ where: { id } });
  }

  async assignPermissions(roleId: number, permissionIds: number[]) {
    await this.findOne(roleId);

    await this.prisma.$transaction([
      this.prisma.uniRolePermissionsV2.deleteMany({ where: { roleId } }),
      this.prisma.uniRolePermissionsV2.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    return this.findOne(roleId);
  }
}
