import { IsString, Length, Matches } from 'class-validator';

/** POST /api/v1/auth/login（契约 §4.2 ③） */
export class LoginDto {
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  @Length(4, 6)
  smsCode: string;
}
