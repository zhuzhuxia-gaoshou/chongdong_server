import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 静态资源：本地上传文件托管（契约 §4.5 ⑬，存储介质由后端自定，前端只认返回 URL）
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/static/',
  });

  // 接口版本前缀 /api/v1（契约 §一）
  app.setGlobalPrefix('api/v1');

  // 全局校验管道：camelCase DTO 校验，禁止多余字段
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 全局响应包裹 + 异常映射（规范 §4.2）
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors();

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 8080);
  await app.listen(port);
  new Logger('Bootstrap').log(`chongdong-api on :${port} (prefix /api/v1)`);
}
void bootstrap();
