import { Controller, Get } from '@nestjs/common';
import { toCstIso } from '../../common/utils/time.util';

/**
 * GET /api/v1/ping（契约 §4.1 ①，免鉴权）
 * 用途：前端连通性诊断与环境显示。
 */
@Controller('ping')
export class SystemController {
  @Get()
  ping() {
    return { service: 'chongdong-api', time: toCstIso() };
  }
}
