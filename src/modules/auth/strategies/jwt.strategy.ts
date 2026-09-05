import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  jti?: string;
  exp?: number;
}

/**
 * access token 校验策略（契约 §4.3：Authorization: Bearer <accessToken>）。
 * 过期由 JwtAuthGuard 捕获 TokenExpiredError → 40101，触发前端自动 refresh。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): { userId: string } {
    if (payload.type !== 'access') throw new UnauthorizedException();
    return { userId: payload.sub };
  }
}
