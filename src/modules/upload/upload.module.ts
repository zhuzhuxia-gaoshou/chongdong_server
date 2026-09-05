import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [AuthModule], // JwtAuthGuard 依赖
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
