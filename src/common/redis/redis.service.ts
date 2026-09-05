import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Redis 封装。用途：refreshToken 黑名单（契约 §4.2 ⑤ logout）、排行榜 ZSet（契约 §4.9 ㉒）、限流。
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    // 连接由 ioredis 在实例化时自动建立；这里仅占位，错误由 error 事件捕获
  }

  getClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: this.config.get<string>('REDIS_PASSWORD') || undefined,
        db: this.config.get<number>('REDIS_DB', 0),
        lazyConnect: false,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });
      this.client.on('error', (err) =>
        this.logger.error(`redis error: ${err.message}`),
      );
    }
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }
}
