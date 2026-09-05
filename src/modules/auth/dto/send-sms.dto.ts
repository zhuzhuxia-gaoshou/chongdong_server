import { Matches } from 'class-validator';

/** POST /api/v1/auth/sms-code（契约 §4.2 ②） */
export class SendSmsDto {
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;
}
