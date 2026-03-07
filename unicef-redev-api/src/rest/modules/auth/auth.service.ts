import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const HASH_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) { }

  async login(email: string, password: string, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.uniUser.findFirst({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (this.isLockedOut(user.logAttempts, user.logTimeout)) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = (user.logAttempts ?? 0) + 1;
      const update: any = { logAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        update.logTimeout = Math.floor(Date.now() / 1000);
      }
      await this.prisma.uniUser.update({ where: { id: user.id }, data: update });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.uniUser.update({
      where: { id: user.id },
      data: { logAttempts: 0, logTimeout: null },
    });

    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    const accessToken = this.jwt.sign(payload);

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.prisma.uniUserLoggedToken.create({
      data: {
        userId: user.id,
        token: accessToken,
        dateLogged: new Date(),
        dateLastVisit: new Date(),
        expires,
        userAgent: meta?.userAgent ?? null,
        ipLogged: meta?.ip ?? null,
      },
    });

    const userWithRole = await this.prisma.uniUser.findUnique({
      where: { id: user.id },
      include: { role: { include: { rolePerms: { include: { permission: true } } } } },
    });

    const permissions = userWithRole?.role?.rolePerms?.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
    })) || [];

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: { title: userWithRole?.role?.title || 'User' },
        permissions
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.uniUser.findFirst({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, HASH_ROUNDS);
    const user = await this.prisma.uniUser.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name ?? null,
        status: 0,
        dateRegistered: new Date(),
      },
    });

    return { id: user.id, email: user.email, name: user.name, status: user.status };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.uniUser.findFirst({ where: { email } });
    if (!user || !user.password) return null;

    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.uniUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        status: true,
        picture: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        region: true,
        lang: true,
        dateRegistered: true,
        role: {
          select: {
            id: true,
            title: true,
            name: true,
            rolePerms: { include: { permission: true } }
          }
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.region !== undefined) data.region = dto.region;

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, HASH_ROUNDS);
    }

    const user = await this.prisma.uniUser.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        region: true,
      },
    });
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.uniUser.findFirst({ where: { email } });
    if (!user) throw new NotFoundException('Email not found');

    const token = crypto.randomBytes(32).toString('hex');
    const dateExpired = new Date();
    dateExpired.setHours(dateExpired.getHours() + 1);

    await this.prisma.uniUserReqtoken.create({
      data: {
        authType: 1,
        authToken: token,
        userId: user.id,
        dateCreated: new Date(),
        dateExpired,
        attempts: 0,
      },
    });

    return { message: 'Reset token generated', token };
  }

  async resetPassword(token: string, newPassword: string) {
    const reqToken = await this.prisma.uniUserReqtoken.findFirst({
      where: { authToken: token, authType: 1 },
    });

    if (!reqToken || !reqToken.userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (reqToken.dateExpired && reqToken.dateExpired < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    const hashed = await bcrypt.hash(newPassword, HASH_ROUNDS);
    await this.prisma.uniUser.update({
      where: { id: reqToken.userId },
      data: { password: hashed },
    });

    await this.prisma.uniUserReqtoken.delete({ where: { id: reqToken.id } });

    return { message: 'Password reset successfully' };
  }

  async findOrCreateGoogleUser(profile: {
    email: string;
    name: string;
    picture?: string;
  }) {
    let user = await this.prisma.uniUser.findFirst({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.uniUser.create({
        data: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture ?? null,
          status: 1,
          dateRegistered: new Date(),
          dateActivated: new Date(),
        },
      });
    } else if (user.status === null || user.status === 0) {
      user = await this.prisma.uniUser.update({
        where: { id: user.id },
        data: {
          status: 1,
          picture: user.picture ?? profile.picture ?? null,
          dateActivated: user.dateActivated ?? new Date(),
        },
      });

      await this.prisma.redevUserAuthMethod.create({
        data: {
          userId: user.id,
          provider: 'sso_google',
          providerId: profile.email,
        },
      });
    }

    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    const accessToken = this.jwt.sign(payload);

    const userWithRole = await this.prisma.uniUser.findUnique({
      where: { id: user.id },
      include: { role: { include: { rolePerms: { include: { permission: true } } } } },
    });

    const permissions = userWithRole?.role?.rolePerms?.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
    })) || [];

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: { title: userWithRole?.role?.title || 'User' },
        permissions
      }
    };
  }

  async logout(userId: number, token: string) {
    await this.prisma.uniUserLoggedToken.deleteMany({
      where: { userId, token },
    });
    return { message: 'Logged out' };
  }

  private isLockedOut(attempts: number | null, timeout: number | null): boolean {
    if (!attempts || attempts < MAX_LOGIN_ATTEMPTS || !timeout) return false;
    const lockedUntil = timeout + LOCKOUT_MINUTES * 60;
    return Math.floor(Date.now() / 1000) < lockedUntil;
  }
}
