/**
 * 错误码分段（契约 §4.6 / 规范 §4.6）
 * 0 成功 | 400xx 参数校验 | 401xx 认证 | 403xx 权限 | 404xx 不存在 | 429xx 限流 | 500xx 服务端
 * 新错误码只能落在对应区段，并写入契约后另一方知悉方可使用。
 */
export const ErrorCodes = {
  OK: 0,

  // 400xx 参数 / 校验类
  BAD_REQUEST: 40000,
  INVALID_PARAM: 40001, // 缺少必填参数 / endTime <= startTime 等
  INVALID_NICKNAME: 40002, // 昵称 1–12 字符
  PET_LIMIT_EXCEEDED: 40003, // 单用户上限 20 只
  NO_NEED_MAKEUP: 40004, // 该日无需补签
  UNSUPPORTED_MEDIA_TYPE: 40006, // 上传类型不支持
  FILE_TOO_LARGE: 40007, // 上传超大小上限

  // 401xx 认证类
  UNAUTHORIZED: 40100, // 未带 token
  ACCESS_TOKEN_EXPIRED: 40101, // accessToken 过期 → 前端自动 refresh 并重放
  SMS_CODE_INVALID: 40102, // 验证码错误或过期
  SMS_CODE_TOO_FREQUENT: 40103, // 60s 内重复发送
  REFRESH_TOKEN_INVALID: 40104, // refreshToken 无效或过期 → 清本地态回登录页

  // 403xx 权限类
  FORBIDDEN: 40300,
  NOT_PET_OWNER: 40301, // 无权操作他人资源
  MAKEUP_CARD_INSUFFICIENT: 40305, // 补签卡不足

  // 404xx 资源不存在
  NOT_FOUND: 40400,
  PET_NOT_FOUND: 40401,
  RECORD_NOT_FOUND: 40402,

  // 429xx 限流
  RATE_LIMITED: 42900,
  SMS_DAILY_LIMIT: 42901, // 单号单日上限 10 条

  // 500xx 服务端异常
  INTERNAL_ERROR: 50000,
} as const;

export const ErrorMessages: Record<number, string> = {
  [ErrorCodes.OK]: 'ok',
  [ErrorCodes.BAD_REQUEST]: 'bad request',
  [ErrorCodes.INVALID_PARAM]: 'invalid parameter',
  [ErrorCodes.INVALID_NICKNAME]: 'nickname must be 1–12 chars',
  [ErrorCodes.PET_LIMIT_EXCEEDED]: 'pet count limit exceeded (max 20)',
  [ErrorCodes.NO_NEED_MAKEUP]: 'no need to make up this day',
  [ErrorCodes.UNSUPPORTED_MEDIA_TYPE]: 'unsupported media type',
  [ErrorCodes.FILE_TOO_LARGE]: 'file too large',
  [ErrorCodes.UNAUTHORIZED]: 'unauthorized',
  [ErrorCodes.ACCESS_TOKEN_EXPIRED]: 'access token expired',
  [ErrorCodes.SMS_CODE_INVALID]: 'sms code invalid or expired',
  [ErrorCodes.SMS_CODE_TOO_FREQUENT]: 'sms code sent too frequently',
  [ErrorCodes.REFRESH_TOKEN_INVALID]: 'refresh token invalid or expired',
  [ErrorCodes.FORBIDDEN]: 'forbidden',
  [ErrorCodes.NOT_PET_OWNER]: 'not the owner of this pet',
  [ErrorCodes.MAKEUP_CARD_INSUFFICIENT]: 'makeup card insufficient',
  [ErrorCodes.NOT_FOUND]: 'not found',
  [ErrorCodes.PET_NOT_FOUND]: 'pet not found',
  [ErrorCodes.RECORD_NOT_FOUND]: 'exercise record not found',
  [ErrorCodes.RATE_LIMITED]: 'rate limited',
  [ErrorCodes.SMS_DAILY_LIMIT]: 'sms daily limit exceeded',
  [ErrorCodes.INTERNAL_ERROR]: 'internal error',
};

/**
 * 业务异常：抛出后由 AllExceptionsFilter 转成 HTTP 200 + body.code（规范 §4.2：业务成败只看 body.code）。
 */
export class BusinessException extends Error {
  constructor(
    public readonly code: number,
    message?: string,
    public readonly data?: unknown,
  ) {
    super(message ?? ErrorMessages[code] ?? 'error');
    this.name = 'BusinessException';
  }

  static from(
    code: number,
    message?: string,
    data?: unknown,
  ): BusinessException {
    return new BusinessException(code, message, data);
  }
}
