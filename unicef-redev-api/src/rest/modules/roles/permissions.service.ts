import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.uniPermissionsV2.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async create(dto: CreatePermissionDto) {
    return this.prisma.uniPermissionsV2.create({
      data: { module: dto.module, action: dto.action },
    });
  }

  async remove(id: number) {
    const perm = await this.prisma.uniPermissionsV2.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException(`Permission #${id} not found`);

    await this.prisma.uniRolePermissionsV2.deleteMany({
      where: { permissionId: id },
    });
    return this.prisma.uniPermissionsV2.delete({ where: { id } });
  }
}
