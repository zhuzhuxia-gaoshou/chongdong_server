import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
}

/** 取当前登录用户（JwtStrategy.validate 返回的 { userId }）。 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return req.user;
  },
);
