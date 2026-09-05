import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** PATCH /api/v1/users/me（契约 §4.3 ⑦）：均可选，至少传一项。 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 12)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
