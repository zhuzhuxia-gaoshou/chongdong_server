import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  BusinessException,
  ErrorCodes,
} from '../../../common/constants/error-codes';

/**
 * 鉴权守卫：区分 accessToken 过期(40101，前端自动 refresh 重放) 与 未带/无效(40100)。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    const infoName = (info as { name?: string } | undefined)?.name;
    if (infoName === 'TokenExpiredError') {
      throw new BusinessException(ErrorCodes.ACCESS_TOKEN_EXPIRED);
    }
    if (err || !user) {
      throw new BusinessException(ErrorCodes.UNAUTHORIZED);
    }
    return user as TUser;
  }
}
