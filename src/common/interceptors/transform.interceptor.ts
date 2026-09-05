import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * 统一响应包裹（规范 §4.2 / 契约 §一）：
 * { code: 0, message: 'ok', data: {} }，成功恒为 code=0。
 * 业务代码永远只处理 data 与 code。
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next
      .handle()
      .pipe(map((data) => ({ code: 0, message: 'ok', data: data ?? null })));
  }
}
