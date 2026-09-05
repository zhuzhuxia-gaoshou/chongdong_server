import { Injectable } from '@nestjs/common';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  serializeUser,
  UserDto,
} from '../../common/serializers/user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ⑥ GET /users/me
  async getMe(userId: string): Promise<UserDto> {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new BusinessException(ErrorCodes.NOT_FOUND);
    return serializeUser(u);
  }

  // ⑦ PATCH /users/me
  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserDto> {
    if (dto.nickname === undefined && dto.avatarUrl === undefined) {
      throw new BusinessException(ErrorCodes.INVALID_PARAM, '至少传一项');
    }
    const u = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined
          ? { nickname: dto.nickname.trim() }
          : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    return serializeUser(u);
  }
}
