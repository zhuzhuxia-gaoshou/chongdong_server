import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** 全局 Prisma 模块，任意模块注入 PrismaService 即可。 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
