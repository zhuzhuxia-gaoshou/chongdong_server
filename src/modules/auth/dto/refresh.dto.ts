import { IsNotEmpty, IsString } from 'class-validator';

/** POST /api/v1/auth/refresh（契约 §4.2 ④）；logout 复用（传 refreshToken 入黑名单）。 */
export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
