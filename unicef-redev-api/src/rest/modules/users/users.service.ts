import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

const HASH_ROUNDS = 10;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  roleId: true,
  status: true,
  gender: true,
  dateRegistered: true,
  dateActivated: true,
  picture: true,
  phoneNumber: true,
  address: true,
  city: true,
  postalCode: true,
  region: true,
  lang: true,
  metaData: true,
  role: { select: { id: true, title: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const { search, status, roleId, limit = 20, offset = 0 } = query;

    const where: any = {};
    if (status !== undefined) where.status = status;
    if (roleId !== undefined) where.roleId = roleId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.uniUser.findMany({
        where,
        select: USER_SELECT,
        take: limit,
        skip: offset,
        orderBy: { id: 'desc' },
      }),
      this.prisma.uniUser.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(id: number) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.uniUser.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, HASH_ROUNDS);

    const user = await this.prisma.uniUser.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        roleId: dto.roleId ?? null,
        status: dto.status ?? 1,
        dateRegistered: new Date(),
      },
      select: USER_SELECT,
    });

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const duplicate = await this.prisma.uniUser.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (duplicate) {
        throw new BadRequestException('Email already in use');
      }
    }

    const data: Record<string, any> = {};
    const fields = [
      'email', 'name', 'roleId', 'status',
      'phoneNumber', 'address', 'city', 'postalCode', 'region',
    ] as const;

    for (const field of fields) {
      if (dto[field] !== undefined) data[field] = dto[field];
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, HASH_ROUNDS);
    }

    return this.prisma.uniUser.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.uniUser.update({
      where: { id },
      data: { status: 0 },
    });
    return { message: `User #${id} deactivated` };
  }

  async assignRole(userId: number, roleId: number) {
    await this.findOne(userId);
    return this.prisma.uniUser.update({
      where: { id: userId },
      data: { roleId },
      select: USER_SELECT,
    });
  }

  async count() {
    const total = await this.prisma.uniUser.count();
    return { total };
  }
}
