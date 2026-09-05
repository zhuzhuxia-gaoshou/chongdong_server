import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** PATCH /api/v1/users/me（契约 §4.3 ⑦）：均可选，至少传一项。 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 64) // 长度语义在 service trim 后校验（契约：去首尾空格后 1–12 字）
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
