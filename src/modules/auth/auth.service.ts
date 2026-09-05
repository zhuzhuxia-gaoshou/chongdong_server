import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ulid } from 'ulid';
import {
  BusinessException,
  ErrorCodes,
} from '../../common/constants/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { genId } from '../../common/utils/id.util';
import { toCstDate } from '../../common/utils/time.util';
import {
  serializeUser,
  UserDto,
} from '../../common/serializers/user.serializer';
import type { JwtPayload } from './strategies/jwt.strategy';

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends TokenBundle {
  isNewUser: boolean;
  user: UserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ② POST /auth/sms-code
  async sendSmsCode(phone: string): Promise<void> {
    const r = this.redis.getClient();
    const coolKey = `sms:cool:${phone}`;
    if (await r.get(coolKey)) {
      throw new BusinessException(ErrorCodes.SMS_CODE_TOO_FREQUENT);
    }
    const dayKey = `sms:day:${phone}:${toCstDate()}`;
    const sent = Number.parseInt((await r.get(dayKey)) ?? '0', 10);
    const dailyLimit = this.config.get<number>('SMS_DAILY_LIMIT', 10);
    if (sent >= dailyLimit) {
      throw new BusinessException(ErrorCodes.SMS_DAILY_LIMIT);
    }

    const code = this.isFakeMode()
      ? this.config.get<string>('SMS_FAKE_CODE', '8888')
      : this.randomCode();

    await r
      .multi()
      .set(
        `sms:code:${phone}`,
        code,
        'EX',
        this.config.get<number>('SMS_CODE_TTL', 300),
      )
      .set(coolKey, '1', 'EX', 60)
      .incr(dayKey)
      .expire(dayKey, 86400)
      .exec();

    if (!this.isFakeMode()) {
      // TODO: 接入阿里云/腾讯云短信发送；当前未接入，dev/test 必须置 SMS_FAKE_ENABLED=true
    }
  }

  // ③ POST /auth/login
  async login(phone: string, smsCode: string): Promise<LoginResult> {
    const r = this.redis.getClient();
    const codeKey = `sms:code:${phone}`;
    const saved = await r.get(codeKey);
    if (!saved || saved !== smsCode) {
      throw new BusinessException(ErrorCodes.SMS_CODE_INVALID);
    }
    await r.del(codeKey); // 一次性使用

    let isNewUser = false;
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: { id: genId('u_'), phone, nickname: '铲屎官' },
      });
    }

    const tokens = await this.issueTokens(user.id);
    return { ...tokens, isNewUser, user: serializeUser(user) };
  }

  // ④ POST /auth/refresh
  async refresh(refreshToken: string): Promise<TokenBundle> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new BusinessException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new BusinessException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }
    const blocked = await this.redis.getClient().get(`auth:bl:${payload.jti}`);
    if (blocked) {
      throw new BusinessException(ErrorCodes.REFRESH_TOKEN_INVALID);
    }
    // 轮换：旧 refresh 作废，签发新对
    await this.blacklistRefresh(payload);
    return this.issueTokens(payload.sub);
  }

  // ⑤ POST /auth/logout（拉黑当前 refreshToken，accessToken 自然到期）
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type === 'refresh' && payload.jti) {
        await this.blacklistRefresh(payload);
      }
    } catch {
      // 无效 refreshToken 静默成功（幂等登出）
    }
  }

  private async issueTokens(userId: string): Promise<TokenBundle> {
    const accessTtl = this.config.get<number>('ACCESS_TOKEN_TTL', 604800);
    const refreshTtl = this.config.get<number>('REFRESH_TOKEN_TTL', 2592000);
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    const accessToken = await this.jwt.signAsync(
      { sub: userId, type: 'access' },
      { secret: accessSecret, expiresIn: accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: ulid(), type: 'refresh' },
      { secret: refreshSecret, expiresIn: refreshTtl },
    );
    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private async blacklistRefresh(payload: JwtPayload): Promise<void> {
    if (!payload.jti || !payload.exp) return;
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis
        .getClient()
        .set(`auth:bl:${payload.jti}`, '1', 'EX', ttl);
    }
  }

  private isFakeMode(): boolean {
    return this.config.get<string>('SMS_FAKE_ENABLED') === 'true';
  }

  private randomCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
