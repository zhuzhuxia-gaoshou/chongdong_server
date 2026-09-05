import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  BusinessException,
  ErrorCodes,
  ErrorMessages,
} from '../constants/error-codes';

/**
 * 全局异常过滤器（规范 §4.2：HTTP 状态码保留网络语义 401/429/500；业务成败只看 body.code）。
 * - BusinessException → HTTP 200 + body.code（业务错误）
 * - HttpException     → 保留其 HTTP status，并映射到对应业务码段
 * - 未知异常           → HTTP 500 + code 50000
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let httpStatus = HttpStatus.OK;
    let code: number = ErrorCodes.INTERNAL_ERROR;
    let message: string = ErrorMessages[ErrorCodes.INTERNAL_ERROR];
    const data: unknown = null;

    if (exception instanceof BusinessException) {
      code = exception.code;
      message = exception.message;
      httpStatus = HttpStatus.OK; // 业务错误走 200 + body.code
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const resp = exception.getResponse();
      const statusToCode: Record<number, number> = {
        [HttpStatus.UNAUTHORIZED]: ErrorCodes.UNAUTHORIZED,
        [HttpStatus.FORBIDDEN]: ErrorCodes.FORBIDDEN,
        [HttpStatus.NOT_FOUND]: ErrorCodes.NOT_FOUND,
        [HttpStatus.TOO_MANY_REQUESTS]: ErrorCodes.RATE_LIMITED,
        [HttpStatus.BAD_REQUEST]: ErrorCodes.BAD_REQUEST,
      };
      code = statusToCode[httpStatus] ?? ErrorCodes.BAD_REQUEST;
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        const m = r.message;
        message = Array.isArray(m)
          ? m.join('; ')
          : ((m as string) ?? exception.message);
      }
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCodes.INTERNAL_ERROR;
      message =
        (exception as Error)?.message ??
        ErrorMessages[ErrorCodes.INTERNAL_ERROR];
      this.logger.error(exception);
    }

    response.status(httpStatus).json({ code, message, data });
  }
}
